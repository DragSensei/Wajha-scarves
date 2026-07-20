import os
from PIL import Image
import uuid
import urllib.request
import urllib.error
import json as _json
import io as _io
import logging
from werkzeug.utils import secure_filename
from api.core.models import Setting, ProductImage

# Protect against decompression bomb DoS attacks (default is ~89M pixels)
Image.MAX_IMAGE_PIXELS = 1920 * 1080 * 2
logger = logging.getLogger(__name__)

def calculate_discounted_price(product):
    """
    Calculates the discounted price of a product based on global sale settings.
    Ensures non-stacking of discounts, handles edge cases for invalid/negative percentages.
    """
    discount_active = Setting.get_setting('discount_active') == 'true'
    try:
        discount_percent = float(Setting.get_setting('discount_percent') or 0)
    except ValueError:
        discount_percent = 0

    if discount_percent < 0 or discount_percent > 100:
        return product.price

    cats_setting = Setting.get_setting('discount_categories')
    discount_categories = [c.strip() for c in cats_setting.split(',')] if cats_setting else []

    ids_setting = Setting.get_setting('discount_product_ids')
    discount_product_ids = [i.strip() for i in ids_setting.split(',')] if ids_setting else []

    if not discount_active or discount_percent <= 0:
        return product.price

    prod_category = product.category_ref.slug if product.category_ref else product.category
    is_category_match = prod_category in discount_categories
    is_item_match = str(product.id) in discount_product_ids

    if is_category_match or is_item_match:
        return product.price * (1.0 - (discount_percent / 100.0))

    return product.price


def process_and_save_image(image_file, upload_dir):
    """
    Processes the image file (resizing to max 1920x1080, RGB conversion, JPEG compression)
    and saves it to Vercel Blob (if token set) or local storage.
    Returns the final filename or URL.
    Raises ValueError for invalid files.
    """
    if not image_file or not image_file.filename:
        raise ValueError("No file uploaded or filename is empty")
        
    filename = secure_filename(image_file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
        raise ValueError(f"Unsupported file extension: {ext}")
        
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    vercel_token = os.environ.get('BLOB_READ_WRITE_TOKEN')

    with Image.open(image_file) as img_obj:
        # ponytail: prevent decompression bomb DoS attacks by checking dimensions (max 25MP)
        w, h = img_obj.size
        if w * h > 25000000:
            raise ValueError("Image dimensions exceed the safety limit of 25 megapixels.")

        if img_obj.mode in ("RGBA", "P"):
            img_obj = img_obj.convert("RGB")
        img_obj.thumbnail((1920, 1080), Image.Resampling.LANCZOS)

        if vercel_token:
            img_io = _io.BytesIO()
            img_obj.save(img_io, format='JPEG', optimize=True, quality=85)

            req = urllib.request.Request(
                f"https://blob.vercel-storage.com/{unique_filename}",
                data=img_io.getvalue(),
                method='PUT'
            )
            req.add_header('authorization', f'Bearer {vercel_token}')
            req.add_header('x-api-version', '7')
            req.add_header('Content-Type', 'image/jpeg')
            req.add_header('x-access', 'public')
            req.add_header('x-add-random-suffix', 'true')

            with urllib.request.urlopen(req) as res:
                resp_data = _json.loads(res.read().decode())
                final_filename = resp_data.get('url')
                if not final_filename:
                    raise Exception("Blob upload returned no URL")
        else:
            os.makedirs(upload_dir, exist_ok=True)
            local_path = os.path.join(upload_dir, unique_filename)
            img_obj.save(local_path, format='JPEG', optimize=True, quality=85)
            final_filename = unique_filename
            
    return final_filename


def delete_product_helper(db_session, product, upload_dir):
    """
    Deletes a product from the database, cascading to ProductImage records,
    and physically deletes associated local image files.
    """
    local_files_to_delete = []
    if product.images:
        for img in product.images:
            if img.filename and not img.filename.startswith('http'):
                local_files_to_delete.append(os.path.join(upload_dir, img.filename))
                
    db_session.delete(product)
    db_session.commit()
    
    for filepath in local_files_to_delete:
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            logger.error(f"Failed to delete physical file {filepath}: {str(e)}")
