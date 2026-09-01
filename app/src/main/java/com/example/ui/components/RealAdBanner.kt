package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

data class AdCampaign(
    val id: String,
    val title: String,
    val description: String,
    val sponsorName: String,
    val callToAction: String,
    val actionUrl: String,
    val badge: String,
    val gradientColors: List<Long>
)

val LIVE_AD_CAMPAIGNS = listOf(
    AdCampaign(
        id = "ad_audio_technica",
        title = "Studio-Grade Lossless ANC Headphones",
        description = "Experience 24-Bit Hi-Res audio mastering with 99.8% acoustic isolation.",
        sponsorName = "Aura Acoustics Pro",
        callToAction = "Explore 40% Off",
        actionUrl = "https://www.google.com/search?q=hi-res+audiophile+headphones",
        badge = "SPONSORED",
        gradientColors = listOf(0xFF4338CA, 0xFF6D28D9)
    ),
    AdCampaign(
        id = "ad_cloud_unlimited",
        title = "Unlimited Lossless Cloud Backup",
        description = "Store 100,000+ FLAC, DSD & WAV songs with zero compression & instant sync.",
        sponsorName = "Aura Cloud Vault",
        callToAction = "Claim Free 100GB",
        actionUrl = "https://www.google.com/search?q=cloud+music+storage+flac",
        badge = "FEATURED PARTNER",
        gradientColors = listOf(0xFF047857, 0xFF0D9488)
    ),
    AdCampaign(
        id = "ad_dac_amplifier",
        title = "High-Res DSD512 USB-C DAC & Amp",
        description = "True 32-Bit/768kHz mobile decoding with zero jitter distortion.",
        sponsorName = "Aura Hi-Fi Hardware",
        callToAction = "View Hardware Specs",
        actionUrl = "https://www.google.com/search?q=usb+c+audiophile+dac+amp",
        badge = "OFFICIAL PARTNER",
        gradientColors = listOf(0xFFBE185D, 0xFF9333EA)
    )
)

@Composable
fun RealAdBanner(
    modifier: Modifier = Modifier,
    campaignIndex: Int = 0,
    onDismiss: (() -> Unit)? = null
) {
    var isDismissed by remember { mutableStateOf(false) }
    if (isDismissed) return

    val uriHandler = LocalUriHandler.current
    val campaign = LIVE_AD_CAMPAIGNS[campaignIndex % LIVE_AD_CAMPAIGNS.size]

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(18.dp))
            .clickable {
                try {
                    uriHandler.openUri(campaign.actionUrl)
                } catch (_: Exception) {}
            },
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
        color = Color(0xFF18181B),
        tonalElevation = 6.dp
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.horizontalGradient(
                        campaign.gradientColors.map { Color(it).copy(alpha = 0.25f) }
                    )
                )
                .padding(14.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Header row: Badge, Sponsor, Close button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = Color(0xFFF59E0B)
                        ) {
                            Text(
                                text = "AD",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 9.sp
                                ),
                                color = Color.Black,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                            )
                        }

                        Text(
                            text = campaign.sponsorName,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            ),
                            color = Color.White.copy(alpha = 0.9f)
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = {
                                isDismissed = true
                                onDismiss?.invoke()
                            },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close Ad",
                                tint = Color.Gray,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Title & Description
                Text(
                    text = campaign.title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = campaign.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.LightGray,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(10.dp))

                // CTA Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = AuraPrimary,
                        modifier = Modifier.clickable {
                            try {
                                uriHandler.openUri(campaign.actionUrl)
                            } catch (_: Exception) {}
                        }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = campaign.callToAction,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                ),
                                color = Color.White
                            )
                            Icon(
                                imageVector = Icons.Default.OpenInNew,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
