package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.AuraPrimary

@Composable
fun QrCodeView(
    dataPayload: String,
    pinCode: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp)),
        color = Color.White,
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Stylized high-density QR Code matrix renderer
            Box(
                modifier = Modifier
                    .size(190.dp)
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val matrixSize = 21
                    val cellSize = size.width / matrixSize

                    // Deterministic pseudorandom pattern based on payload hash
                    val hash = dataPayload.hashCode()
                    for (row in 0 until matrixSize) {
                        for (col in 0 until matrixSize) {
                            // Draw Finder Patterns (Corners)
                            val isTopLeftFinder = (row in 0..6 && col in 0..6)
                            val isTopRightFinder = (row in 0..6 && col in (matrixSize - 7) until matrixSize)
                            val isBottomLeftFinder = (row in (matrixSize - 7) until matrixSize && col in 0..6)

                            var isFilled = false

                            if (isTopLeftFinder) {
                                val r = row
                                val c = col
                                isFilled = (r == 0 || r == 6 || c == 0 || c == 6 || (r in 2..4 && c in 2..4))
                            } else if (isTopRightFinder) {
                                val r = row
                                val c = col - (matrixSize - 7)
                                isFilled = (r == 0 || r == 6 || c == 0 || c == 6 || (r in 2..4 && c in 2..4))
                            } else if (isBottomLeftFinder) {
                                val r = row - (matrixSize - 7)
                                val c = col
                                isFilled = (r == 0 || r == 6 || c == 0 || c == 6 || (r in 2..4 && c in 2..4))
                            } else {
                                // Data bits pattern
                                val bitVal = (hash * (row * 31 + col * 17) + row * col) % 7
                                isFilled = bitVal % 2 == 0
                            }

                            if (isFilled) {
                                drawRect(
                                    color = Color(0xFF0F172A),
                                    topLeft = Offset(col * cellSize, row * cellSize),
                                    size = Size(cellSize * 0.94f, cellSize * 0.94f)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "PAIRING PIN CODE",
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
