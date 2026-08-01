# Launch Flask backend, Vite frontend, and open Brave Browser
Start-Process -FilePath "python" -ArgumentList "-m flask --app api run --port 5000"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev"

Start-Sleep -Seconds 3

$bravePath = "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
$bravePathX86 = "C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe"

if (Test-Path $bravePath) {
    Start-Process -FilePath $bravePath -ArgumentList "http://localhost:5173"
} elseif (Test-Path $bravePathX86) {
    Start-Process -FilePath $bravePathX86 -ArgumentList "http://localhost:5173"
} else {
    Start-Process "http://localhost:5173"
}
