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

from api.core.utils import calculate_discounted_price

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


def get_user_wishlist_ids(db_session, user_id):
    from api.core.models import WishlistItem
    items = db_session.query(WishlistItem).filter(WishlistItem.user_id == user_id).all()
    return [item.product_id for item in items]


def get_user_wishlist(db_session, user_id, request=None):
    from api.core.models import WishlistItem
    query = db_session.query(WishlistItem).filter(WishlistItem.user_id == user_id).order_by(WishlistItem.created_at.desc())
    if request is not None:
        from api.core.utils import paginate_query
        pagination = paginate_query(query, request)
        return {
            "wishlist": [item.product_id for item in pagination.items],
            "pagination": {
                "page": pagination.page,
                "per_page": pagination.per_page,
                "total_items": pagination.total,
                "total_pages": pagination.pages,
                "has_next": pagination.has_next,
                "has_prev": pagination.has_prev
            }
        }
    items = query.all()
    return {"wishlist": [item.product_id for item in items]}


def add_to_wishlist(db_session, user_id, product_id):
    from api.core.models import WishlistItem, Product
    product = db_session.get(Product, product_id)
    if not product:
        raise ValueError("Product not found")

    existing = db_session.query(WishlistItem).filter_by(user_id=user_id, product_id=product_id).first()
    if not existing:
        item = WishlistItem(user_id=user_id, product_id=product_id)
        db_session.add(item)
        db_session.commit()
    return get_user_wishlist_ids(db_session, user_id)


def remove_from_wishlist(db_session, user_id, product_id):
    from api.core.models import WishlistItem
    existing = db_session.query(WishlistItem).filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        db_session.delete(existing)
        db_session.commit()
    return get_user_wishlist_ids(db_session, user_id)


def sync_user_wishlist(db_session, user_id, product_ids):
    from api.core.models import WishlistItem, Product
    if not isinstance(product_ids, list):
        raise ValueError("product_ids must be a list")

    for pid in product_ids:
        try:
            pid = int(pid)
            prod = db_session.get(Product, pid)
            if not prod:
                continue
            existing = db_session.query(WishlistItem).filter_by(user_id=user_id, product_id=pid).first()
            if not existing:
                item = WishlistItem(user_id=user_id, product_id=pid)
                db_session.add(item)
        except (ValueError, TypeError):
            continue
            
    db_session.commit()
    return get_user_wishlist_ids(db_session, user_id)
