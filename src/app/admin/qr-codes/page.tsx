"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download, Printer } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import { useToast } from "@/components/ui/use-toast";

function QRCodeGeneratorContent() {
  const [numTables, setNumTables] = useState(20);
  const { toast } = useToast();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  function downloadQRCode(url: string, filename: string) {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Generate QR code using qrcode library (we'll use a simple approach)
    // For production, use: npm install qrcode
    // For now, we'll use Google Charts API as a fallback
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      url
    )}`;

    // Create image and download
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    };
    img.src = qrUrl;
  }

  function downloadAllTableQRs() {
    toast({
      title: "Generating QR Codes",
      description: `Generating ${numTables} table QR codes...`,
    });

    for (let i = 1; i <= numTables; i++) {
      setTimeout(() => {
        const url = `${baseUrl}/order?type=dine-in&table=${i}`;
        downloadQRCode(url, `table-${i}-qr.png`);
      }, i * 500); // Stagger downloads
    }

    setTimeout(() => {
      toast({
        title: "Success",
        description: "All QR codes generated!",
      });
    }, numTables * 500 + 1000);
  }

  function downloadTakeawayQR() {
    const url = `${baseUrl}/order?type=takeaway`;
    downloadQRCode(url, "takeaway-qr.png");

    toast({
      title: "Success",
      description: "Takeaway QR code downloaded!",
    });
  }

  function printQRSheet() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FoodieHub QR Codes</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            padding: 20px;
          }
          .qr-card {
            width: 200px;
            border: 2px solid #000;
            padding: 15px;
            text-center;
            break-inside: avoid;
          }
          .qr-card h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: bold;
          }
          .qr-card img {
            width: 180px;
            height: 180px;
          }
          .qr-card p {
            margin: 10px 0 0 0;
            font-size: 14px;
          }
          .takeaway {
            border-color: #2563eb;
          }
          .takeaway h3 {
            color: #2563eb;
          }
        </style>
      </head>
      <body>
    `;

    // Add table QR codes
    for (let i = 1; i <= numTables; i++) {
      const url = `${baseUrl}/order?type=dine-in&table=${i}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        url
      )}`;
      html += `
        <div class="qr-card">
          <h3>🪑 Table ${i}</h3>
          <img src="${qrUrl}" alt="Table ${i} QR Code" />
          <p>Scan to order</p>
        </div>
      `;
    }

    // Add takeaway QR code
    const takeawayUrl = `${baseUrl}/order?type=takeaway`;
    const takeawayQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      takeawayUrl
    )}`;
    html += `
      <div class="qr-card takeaway">
        <h3>📦 TAKEAWAY</h3>
        <img src="${takeawayQrUrl}" alt="Takeaway QR Code" />
        <p>Scan for pickup orders</p>
      </div>
    `;

    html += `
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container px-4 py-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <QrCode className="h-8 w-8" />
            QR Code Generator
          </h1>
          <p className="text-purple-100 mt-1">
            Generate QR codes for tables and takeaway orders
          </p>
        </div>
      </div>

      <div className="container px-4 py-6 max-w-4xl">
        {/* Instructions */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              ℹ️ How to Use QR Codes
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                • <strong>Table QR Codes:</strong> Print and place one QR code
                on each table
              </li>
              <li>
                • <strong>Takeaway QR Code:</strong> Print and place at the
                counter/entrance
              </li>
              <li>
                • <strong>Customers scan</strong> the QR code to start ordering
              </li>
              <li>
                • <strong>Table number</strong> is automatically captured for
                dine-in orders
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Table QR Codes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🪑 Dine-In Table QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="numTables">Number of Tables</Label>
                <Input
                  id="numTables"
                  type="number"
                  min="1"
                  max="100"
                  value={numTables}
                  onChange={(e) => setNumTables(parseInt(e.target.value) || 1)}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Will generate QR codes for Table 1 to Table {numTables}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={downloadAllTableQRs}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All ({numTables} QR Codes)
                </Button>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-semibold mb-3">Preview:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((num) => (
                    <div
                      key={num}
                      className="bg-white p-3 rounded border text-center"
                    >
                      <p className="font-bold mb-2">Table {num}</p>
                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                          `${baseUrl}/order?type=dine-in&table=${num}`
                        )}`}
                        alt={`Table ${num}`}
                        width={150}
                        height={150}
                        className="w-full"
                        unoptimized
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => {
                          const url = `${baseUrl}/order?type=dine-in&table=${num}`;
                          downloadQRCode(url, `table-${num}-qr.png`);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Takeaway QR Code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 Takeaway QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Generate a QR code for takeaway/pickup orders to be placed at
                your counter or entrance.
              </p>

              <Button
                onClick={downloadTakeawayQR}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Takeaway QR Code
              </Button>

              {/* Preview */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-xs">
                <p className="text-sm font-semibold mb-3">Preview:</p>
                <div className="bg-white p-4 rounded border text-center">
                  <p className="font-bold mb-2 text-blue-700 text-lg">
                    📦 TAKEAWAY
                  </p>
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `${baseUrl}/order?type=takeaway`
                    )}`}
                    alt="Takeaway QR"
                    width={200}
                    height={200}
                    className="w-full"
                    unoptimized
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Scan for pickup orders
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print All */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print All QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Print all QR codes ({numTables} tables + 1 takeaway) on a single
              sheet for easy printing.
            </p>
            <Button
              onClick={printQRSheet}
              className="bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All QR Codes
            </Button>
          </CardContent>
        </Card>

        {/* URLs Reference */}
        <Card className="mt-6 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">🔗 URL Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <p className="text-gray-600">Dine-in URL format:</p>
                <p className="bg-white p-2 rounded border break-all">
                  {baseUrl}/order?type=dine-in&table=[NUMBER]
                </p>
              </div>
              <div>
                <p className="text-gray-600">Takeaway URL:</p>
                <p className="bg-white p-2 rounded border break-all">
                  {baseUrl}/order?type=takeaway
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function QRCodeGeneratorPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <QRCodeGeneratorContent />
    </RoleGuard>
  );
}
