package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary
import kotlin.math.*

@Composable
fun DialKnob(
    value: Float, // 0f to 1f
    onValueChange: (Float) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    activeColor: Color = AuraPrimary,
    glowColor: Color = AuraSecondary
) {
    val startAngle = 135f
    val sweepAngle = 270f

    val currentValue by rememberUpdatedState(value)
    val currentOnValueChange by rememberUpdatedState(onValueChange)

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(76.dp)
                .pointerInput(Unit) {
                    detectTapGestures { offset ->
                        val centerX = size.width / 2f
                        val centerY = size.height / 2f
                        val dx = offset.x - centerX
                        val dy = offset.y - centerY
                        var angle = Math.toDegrees(atan2(dy.toDouble(), dx.toDouble())).toFloat()
                        if (angle < 0) angle += 360f

                        // Map angle to 0..1 based on startAngle = 135 to 405 (45)
                        val normalizedAngle = when {
                            angle >= 135f -> angle - 135f
                            angle <= 45f -> (360f - 135f) + angle
                            else -> if (angle < 90f) 270f else 0f
                        }
                        val computedValue = (normalizedAngle / sweepAngle).coerceIn(0f, 1f)
                        currentOnValueChange(computedValue)
                    }
                }
                .pointerInput(Unit) {
                    detectDragGestures { change, dragAmount ->
                        change.consume()
                        // Supports vertical drag (drag up to increase, down to decrease)
                        // and horizontal drag (drag right to increase, left to decrease)
                        val delta = (-dragAmount.y * 0.007f) + (dragAmount.x * 0.007f)
                        val newValue = (currentValue + delta).coerceIn(0f, 1f)
                        currentOnValueChange(newValue)
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize().padding(6.dp)) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val radius = (size.minDimension / 2f) - 6.dp.toPx()

                // Background track arc
                drawArc(
                    color = Color.DarkGray.copy(alpha = 0.45f),
                    startAngle = startAngle,
                    sweepAngle = sweepAngle,
                    useCenter = false,
                    topLeft = Offset(center.x - radius, center.y - radius),
                    size = Size(radius * 2, radius * 2),
                    style = Stroke(width = 6.dp.toPx(), cap = StrokeCap.Round)
                )

                // Active value arc
                val activeSweep = (sweepAngle * currentValue).coerceIn(0.1f, sweepAngle)
                drawArc(
                    brush = Brush.sweepGradient(
                        colors = listOf(activeColor, glowColor, activeColor)
                    ),
                    startAngle = startAngle,
                    sweepAngle = activeSweep,
                    useCenter = false,
                    topLeft = Offset(center.x - radius, center.y - radius),
                    size = Size(radius * 2, radius * 2),
                    style = Stroke(width = 7.dp.toPx(), cap = StrokeCap.Round)
                )

                // Center knob cap
                drawCircle(
                    color = Color(0xFF1E202C),
                    radius = radius * 0.72f,
                    center = center
                )

                // Indicator needle dot
                val currentAngleRad = Math.toRadians((startAngle + activeSweep).toDouble())
                val needleRadius = radius * 0.52f
                val needleX = center.x + (needleRadius * cos(currentAngleRad)).toFloat()
                val needleY = center.y + (needleRadius * sin(currentAngleRad)).toFloat()

                drawCircle(
                    color = Color.White,
                    radius = 3.5.dp.toPx(),
                    center = Offset(needleX, needleY)
                )
            }

            // Percentage readout
            Text(
                text = "${(currentValue * 100).toInt()}%",
                style = MaterialTheme.typography.labelSmall.copy(
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                ),
                color = MaterialTheme.colorScheme.onSurface
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
