package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import com.example.model.AppThemeMode

private val OledColorScheme = darkColorScheme(
    primary = AuraPrimary,
    onPrimary = Color.White,
    primaryContainer = AuraPrimaryVariant,
    onPrimaryContainer = Color.White,
    secondary = AuraSecondary,
    onSecondary = Color.Black,
    secondaryContainer = OledSurfaceElevated,
    onSecondaryContainer = AuraSecondary,
    tertiary = AuraAccentPink,
    background = OledBackground,
    onBackground = OledTextPrimary,
    surface = OledSurface,
    onSurface = OledTextPrimary,
    surfaceVariant = OledSurfaceVariant,
    onSurfaceVariant = OledTextSecondary,
    outline = OledBorder,
    outlineVariant = OledBorderSubtle
)

private val DarkColorScheme = darkColorScheme(
    primary = AuraPrimary,
    onPrimary = Color.White,
    primaryContainer = AuraPrimaryVariant,
    onPrimaryContainer = Color.White,
    secondary = AuraSecondary,
    onSecondary = Color.Black,
    secondaryContainer = DarkSurfaceVariant,
    onSecondaryContainer = AuraSecondary,
    tertiary = AuraAccentPink,
    background = DarkBackground,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = DarkTextSecondary,
    outline = DarkBorder
)

private val LightColorScheme = lightColorScheme(
    primary = AuraPrimaryVariant,
    onPrimary = Color.White,
    secondary = AuraSecondary,
    tertiary = AuraAccentPink,
    background = LightBackground,
    onBackground = LightTextPrimary,
    surface = LightSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = LightSurfaceVariant,
    onSurfaceVariant = LightTextSecondary,
    outline = LightBorder
)

@Composable
fun MyApplicationTheme(
    themeMode: AppThemeMode = AppThemeMode.OLED_BLACK,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val colorScheme = when (themeMode) {
        AppThemeMode.OLED_BLACK -> OledColorScheme
        AppThemeMode.DARK_MATERIAL -> DarkColorScheme
        AppThemeMode.LIGHT_AIR -> LightColorScheme
        AppThemeMode.DYNAMIC_ALBUM_ART -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                dynamicDarkColorScheme(context)
            } else {
                OledColorScheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
