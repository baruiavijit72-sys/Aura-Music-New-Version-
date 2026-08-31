package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@Composable
fun AudioVisualizer(
    frequencies: List<Float>,
    modifier: Modifier = Modifier,
    barColor: Color = AuraPrimary,
    accentColor: Color = AuraSecondary,
    barCount: Int = 32
) {
    val infiniteTransition = rememberInfiniteTransition(label = "visualizerPulse")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAnimation"
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp)
            .clip(RoundedCornerShape(8.dp))
    ) {
        val totalBars = if (frequencies.isNotEmpty()) frequencies.size.coerceAtMost(barCount) else barCount
        val barWidth = (size.width / (totalBars * 1.5f)).coerceAtLeast(3f)
        val spacing = barWidth * 0.5f

        val brush = Brush.verticalGradient(
            colors = listOf(accentColor, barColor),
            startY = 0f,
            endY = size.height
        )

        for (i in 0 until totalBars) {
            val rawHeight = if (frequencies.isNotEmpty() && i < frequencies.size) {
                frequencies[i]
            } else {
                0.2f
            }

            val dynamicHeight = (rawHeight * pulse).coerceIn(0.08f, 1f) * size.height
            val x = i * (barWidth + spacing)
            val y = size.height - dynamicHeight

            drawRoundRect(
                brush = brush,
                topLeft = Offset(x, y),
                size = Size(barWidth, dynamicHeight),
                cornerRadius = CornerRadius(barWidth / 2f, barWidth / 2f)
            )
        }
    }
}
