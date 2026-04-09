# OOTD 테마 아이콘 (옷걸이 실루엣)
Add-Type -AssemblyName System.Drawing
foreach ($size in 192,512) {
  $bmp = New-Object System.Drawing.Bitmap $size,$size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Black)

  $stroke = $size * 0.045
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), $stroke
  $pen.StartCap = 'Round'
  $pen.EndCap = 'Round'
  $pen.LineJoin = 'Round'

  $cx = $size / 2

  # 옷걸이 갈고리 (작은 원)
  $hookCY = $size * 0.32
  $hookR  = $size * 0.05
  $g.DrawEllipse($pen, ($cx - $hookR), ($hookCY - $hookR), ($hookR * 2), ($hookR * 2))

  # 삼각형 꼭지점 (갈고리 바로 아래)
  $apexY = $hookCY + $hookR + ($stroke / 2)

  # 가로 바
  $barY     = $size * 0.62
  $barLeft  = $size * 0.18
  $barRight = $size * 0.82

  # 양쪽 대각선
  $g.DrawLine($pen, $cx, $apexY, $barLeft, $barY)
  $g.DrawLine($pen, $cx, $apexY, $barRight, $barY)

  # 가로 바
  $g.DrawLine($pen, $barLeft, $barY, $barRight, $barY)

  $g.Dispose()
  $bmp.Save("C:/Users/koo/Desktop/MirrorMe/docs/icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Write-Host "OK"
