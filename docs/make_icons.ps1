Add-Type -AssemblyName System.Drawing
foreach ($size in 192,512) {
  $bmp = New-Object System.Drawing.Bitmap $size,$size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Black)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($size*0.027)
  $r = $size*0.29
  $g.DrawEllipse($pen, ($size/2 - $r), ($size/2 - $r), ($r*2), ($r*2))
  $brush = [System.Drawing.Brushes]::White
  $r2 = $size*0.113
  $g.FillEllipse($brush, ($size/2 - $r2), ($size/2 - $r2), ($r2*2), ($r2*2))
  $bw = $size*0.336
  $bh = $size*0.055
  $g.FillRectangle($brush, ($size/2 - $bw/2), ($size*0.234), $bw, $bh)
  $g.Dispose()
  $bmp.Save("C:/Users/koo/Desktop/MirrorMe/web/icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Write-Host "OK"
