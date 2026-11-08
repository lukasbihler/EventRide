# Bildvarianten für die SEO-Seiten (Eventkarten, Event-Header, Vorschaubild).
#
# Neue Bilder in  public/assets/image/{kategorie}/neu/  legen (jpg/png/webp),
# Kategorien: kirchtag, feuerwehr, disco, ball, krampus, festival, beach.
# Themenbilder (z. B. halloween) genauso unter  public/assets/image/{thema}/neu/
# ablegen; jeder weitere Ordner dort wird mitverarbeitet. Damit das Bild
# verwendet wird, in functions/src/seo/hubs.ts beim Thema das Feld image setzen
# (letzter Parameter von themaHub, z. B. "halloween").
# Dann:  powershell -ExecutionPolicy Bypass -File scripts/seo_bilder.ps1
#
# Pro Bild entstehen  {n}.jpg  (1200x630, Header + og:image) und  {n}-640.jpg
# (640x360, Karten), jeweils mittig zugeschnitten. Die Originale wandern nach
# seo_bilder_original/{kategorie}/. Danach wird functions/src/seo/bilder.ts neu
# geschrieben — die Function muss neu deployt werden, damit sie die neuen
# Varianten verwendet (Auswahl pro Event stabil über den Slug).

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore
$root = Split-Path $PSScriptRoot -Parent
$kategorien = @('kirchtag', 'feuerwehr', 'disco', 'ball', 'krampus', 'festival', 'beach')
$kategorien += @(Get-ChildItem (Join-Path $root 'public\assets\image') -Directory |
  Where-Object { $kategorien -notcontains $_.Name -and $_.Name -match '^[a-z][a-z0-9]*$' } |
  Sort-Object Name | ForEach-Object { $_.Name })

function Laden($pfad) {
  $s = [IO.File]::OpenRead($pfad)
  try {
    $d = [Windows.Media.Imaging.BitmapDecoder]::Create($s,
      [Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
      [Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
    return $d.Frames[0]
  } finally { $s.Close() }
}

# Mittiger Zuschnitt auf das Seitenverhältnis w:h, dann skalieren, als JPEG speichern.
function Variante($bild, $w, $h, $ziel, $qualitaet) {
  $quelleW = $bild.PixelWidth; $quelleH = $bild.PixelHeight
  $cw = $quelleW; $ch = [int][Math]::Floor($quelleW * $h / $w)
  if ($ch -gt $quelleH) { $ch = $quelleH; $cw = [int][Math]::Floor($quelleH * $w / $h) }
  $x = [int](($quelleW - $cw) / 2); $y = [int](($quelleH - $ch) / 2)
  $crop = New-Object Windows.Media.Imaging.CroppedBitmap($bild, (New-Object Windows.Int32Rect($x, $y, $cw, $ch)))
  $k = $w / $cw
  $skaliert = New-Object Windows.Media.Imaging.TransformedBitmap($crop, (New-Object Windows.Media.ScaleTransform($k, $k)))
  $enc = New-Object Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = $qualitaet
  $enc.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($skaliert))
  $fs = [IO.File]::Create($ziel); try { $enc.Save($fs) } finally { $fs.Close() }
}

$anzahl = [ordered]@{}
foreach ($kat in $kategorien) {
  $dir = Join-Path $root "public\assets\image\$kat"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $neu = Join-Path $dir 'neu'
  $vorhanden = @(Get-ChildItem $dir -File | Where-Object { $_.Name -match '^\d+\.jpg$' })
  $n = $vorhanden.Count
  if (Test-Path $neu) {
    $archiv = Join-Path $root "seo_bilder_original\$kat"
    New-Item -ItemType Directory -Force $archiv | Out-Null
    foreach ($datei in Get-ChildItem $neu -File | Where-Object { $_.Extension -match '^\.(jpe?g|png|webp)$' } | Sort-Object Name) {
      $n++
      $bild = Laden $datei.FullName
      Variante $bild 1200 630 (Join-Path $dir "$n.jpg") 80
      Variante $bild 640 360 (Join-Path $dir "$n-640.jpg") 72
      Move-Item $datei.FullName (Join-Path $archiv $datei.Name) -Force
      Write-Host "$kat/$n  <-  $($datei.Name)"
    }
  }
  $anzahl[$kat] = $n
}

$zeilen = ($anzahl.Keys | ForEach-Object { "  $($_): $($anzahl[$_])," }) -join "`n"
$ts = @"
// Automatisch erzeugt von scripts/seo_bilder.ps1 - nicht von Hand bearbeiten.
// Anzahl der Bildvarianten pro Kategorie bzw. Thema unter public/assets/image/{name}/.

export const BILDER: Record<string, number> = {
$zeilen
};
"@
[IO.File]::WriteAllText((Join-Path $root 'functions\src\seo\bilder.ts'), $ts.Replace("`r`n", "`n") + "`n", (New-Object Text.UTF8Encoding $false))
Write-Host "bilder.ts: $(($anzahl.Keys | ForEach-Object { "$($_)=$($anzahl[$_])" }) -join ', ')"
