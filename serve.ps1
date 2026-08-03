# Hostel Manager — Pure PowerShell HTTP Server
# No Node.js or Python needed

$port = 8080
$file = "$PSScriptRoot\hostel_manager.html"
$url  = "http://localhost:$port/"

# Get local IP for network access
$localIP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169' } |
    Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "  =========================================" -ForegroundColor Cyan
Write-Host "   HOSTEL DORMITORY MANAGER" -ForegroundColor White
Write-Host "  =========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Local:    http://localhost:$port" -ForegroundColor Green
Write-Host "  Network:  http://${localIP}:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Scan QR or open the URL above in browser" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "  =========================================" -ForegroundColor Cyan
Write-Host ""

# Open browser automatically
Start-Process "http://localhost:$port"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$port/")

try {
    $listener.Start()
} catch {
    # Try localhost only if + binding fails (needs admin)
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($url)
    $listener.Start()
    Write-Host "  Running on localhost only (run as Admin for network access)" -ForegroundColor Yellow
}

$html = Get-Content $file -Raw -Encoding UTF8

while ($listener.IsListening) {
    try {
        $ctx      = $listener.GetContext()
        $req      = $ctx.Request
        $resp     = $ctx.Response
        $resp.ContentType     = "text/html; charset=utf-8"
        $resp.StatusCode      = 200
        $resp.AddHeader("Cache-Control", "no-cache")
        $resp.AddHeader("Access-Control-Allow-Origin", "*")
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($html)
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
        $resp.OutputStream.Close()
        Write-Host "  [$([DateTime]::Now.ToString('HH:mm:ss'))]  $($req.HttpMethod) $($req.RawUrl)  from $($req.RemoteEndPoint)" -ForegroundColor DarkGray
    } catch { }
}
