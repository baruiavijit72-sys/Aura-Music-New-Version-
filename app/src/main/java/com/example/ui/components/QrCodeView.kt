package com.example.ui.components

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel

@Composable
fun QrCodeView(
    dataPayload: String,
    pinCode: String = "",
    isPayment: Boolean = false,
    paymentAmount: String? = null,
    modifier: Modifier = Modifier
) {
    // Generate 100% Genuine, Real Scannable QR Code via ZXing
    val qrBitmap = remember(dataPayload) {
        generateQrBitmap(dataPayload, 512)
    }

    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp)),
        color = Color.White,
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (isPayment) {
                // Official UPI Header Banner
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFF0F172A)
                    ) {
                        Text(
                            text = "BHIM ▶ UPI",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Black,
                                fontSize = 11.sp,
                                letterSpacing = 1.sp
                            ),
                            color = Color(0xFF38BDF8),
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFF10B981).copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = "100% DIRECT SCAN",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp
                            ),
                            color = Color(0xFF059669),
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
            }

            Box(
                modifier = Modifier
                    .size(210.dp)
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                if (qrBitmap != null) {
                    Image(
                        bitmap = qrBitmap.asImageBitmap(),
                        contentDescription = "Scan UPI QR Code",
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.QrCodeScanner,
                        contentDescription = null,
                        tint = Color.Black,
                        modifier = Modifier.size(100.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            if (isPayment) {
                // Real Genuine UPI Payment Scanner Information
                Text(
                    text = "Scan & Pay with Any UPI App",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    ),
                    color = Color(0xFF0F172A)
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = "PhonePe • Google Pay • Paytm • BHIM • CRED",
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontWeight = FontWeight.Medium,
                        fontSize = 10.sp
                    ),
                    color = Color(0xFF64748B)
                )

                if (paymentAmount != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFF0F172A)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "Amount to Pay:",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Normal,
                                    fontSize = 11.sp
                                ),
                                color = Color(0xFF94A3B8)
                            )
                            Text(
                                text = "₹$paymentAmount",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 14.sp
                                ),
                                color = Color(0xFFFBBF24)
                            )
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = Color(0xFFEF4444).copy(alpha = 0.2f)
                            ) {
                                Text(
                                    text = "🔒 LOCKED",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Black,
                                        fontSize = 9.sp
                                    ),
                                    color = Color(0xFFF87171),
                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Exact transfer required. Do not modify the amount during scan.",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Normal
                        ),
                        color = Color(0xFF64748B)
                    )
                }
            } else {
                // P2P Sharing Device Pairing Pin
                Text(
                    text = "DEVICE PAIRING PIN",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                    color = Color.DarkGray
                )

                Spacer(modifier = Modifier.height(4.dp))

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF0F172A)
                ) {
                    Text(
                        text = pinCode,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 3.sp
                        ),
                        color = Color(0xFF38BDF8),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }
            }
        }
    }
}

private fun generateQrBitmap(data: String, size: Int): Bitmap? {
    return try {
        val hints = HashMap<EncodeHintType, Any>().apply {
            put(EncodeHintType.CHARACTER_SET, "UTF-8")
            put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M)
            put(EncodeHintType.MARGIN, 1)
        }
        val bitMatrix = QRCodeWriter().encode(data, BarcodeFormat.QR_CODE, size, size, hints)
        val width = bitMatrix.width
        val height = bitMatrix.height
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        for (x in 0 until width) {
            for (y in 0 until height) {
                bitmap.setPixel(
                    x,
                    y,
                    if (bitMatrix.get(x, y)) android.graphics.Color.BLACK else android.graphics.Color.WHITE
                )
            }
        }
        bitmap
    } catch (e: Exception) {
        null
    }
}
