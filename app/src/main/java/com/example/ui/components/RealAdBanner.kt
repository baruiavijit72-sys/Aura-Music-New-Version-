package com.example.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.AuraPrimary
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

data class AdCampaign(
    val id: String,
    val brandKey: String,
    val sponsorName: String,
    val category: String,
    val title: String,
    val description: String,
    val callToAction: String,
    val actionUrl: String,
    val packageName: String?,
    val deepLinkUri: String?,
    val badge: String,
    val rating: String,
    val brandColor: Long,
    val gradientColors: List<Long>
)

val LIVE_AD_CAMPAIGNS = listOf(
    // 1. Facebook Official Ad
    AdCampaign(
        id = "ad_facebook",
        brandKey = "facebook",
        sponsorName = "Facebook",
        category = "Social & Community",
        title = "Connect with friends, explore Reels & groups",
        description = "Discover trending videos, join millions of active communities, and share life updates with friends and family worldwide.",
        callToAction = "Open Facebook",
        actionUrl = "https://www.facebook.com",
        packageName = "com.facebook.katana",
        deepLinkUri = "fb://facewebmodal/f?href=https://www.facebook.com",
        badge = "VERIFIED",
        rating = "4.4 ★ (5B+ Downloads)",
        brandColor = 0xFF1877F2,
        gradientColors = listOf(0xFF1877F2, 0xFF0D47A1)
    ),

    // 2. YouTube Premium Official Ad
    AdCampaign(
        id = "ad_youtube",
        brandKey = "youtube",
        sponsorName = "YouTube",
        category = "Video & Music",
        title = "YouTube Premium – Watch & Listen Ad-Free",
        description = "Stream uninterrupted videos and 100M+ songs with background playback, screen-off listening, and unlimited offline downloads.",
        callToAction = "Try 1 Month Free",
        actionUrl = "https://www.youtube.com/premium",
        packageName = "com.google.android.youtube",
        deepLinkUri = "vnd.youtube://",
        badge = "SPONSORED",
        rating = "4.6 ★ (10B+ Downloads)",
        brandColor = 0xFFFF0000,
        gradientColors = listOf(0xFFDC2626, 0xFF7F1D1D)
    ),

    // 3. Instagram Official Ad
    AdCampaign(
        id = "ad_instagram",
        brandKey = "instagram",
        sponsorName = "Instagram",
        category = "Photo, Reels & Stories",
        title = "Discover viral Reels & connect with creators",
        description = "Watch trending short videos with high-bitrate music, express your everyday moments, and message close friends instantly.",
        callToAction = "Open Instagram",
        actionUrl = "https://www.instagram.com",
        packageName = "com.instagram.android",
        deepLinkUri = "instagram://app",
        badge = "POPULAR",
        rating = "4.7 ★ (5B+ Downloads)",
        brandColor = 0xFFE1306C,
        gradientColors = listOf(0xFF833AB4, 0xFFFD1D1D, 0xFFF77737)
    ),

    // 4. Spotify Official Ad
    AdCampaign(
        id = "ad_spotify",
        brandKey = "spotify",
        sponsorName = "Spotify",
        category = "Music & Podcasts",
        title = "Spotify Premium – Unlimited Skips & Lossless Audio",
        description = "Enjoy music without ad interruptions. Download high-fidelity playlists for flights and daily road trips.",
        callToAction = "Get 3 Months Free",
        actionUrl = "https://open.spotify.com",
        packageName = "com.spotify.music",
        deepLinkUri = "spotify://",
        badge = "TRENDING",
        rating = "4.5 ★ (1B+ Downloads)",
        brandColor = 0xFF1DB954,
        gradientColors = listOf(0xFF1DB954, 0xFF065F46)
    ),

    // 5. Amazon Prime Video & Shopping
    AdCampaign(
        id = "ad_amazon",
        brandKey = "amazon",
        sponsorName = "Amazon Prime",
        category = "Shopping & Streaming",
        title = "Amazon Prime – Free 1-Day Delivery & Prime Video",
        description = "Stream award-winning cinema and blockbuster originals, plus unlock exclusive deals and lightning-fast free doorstep shipping.",
        callToAction = "Join Prime Today",
        actionUrl = "https://www.amazon.com/prime",
        packageName = "com.amazon.mShop.android.shopping",
        deepLinkUri = "amazon://",
        badge = "SPECIAL OFFER",
        rating = "4.6 ★ (500M+ Downloads)",
        brandColor = 0xFF00A8E1,
        gradientColors = listOf(0xFF00A8E1, 0xFF0C4A6E)
    ),

    // 6. Netflix Official Ad
    AdCampaign(
        id = "ad_netflix",
        brandKey = "netflix",
        sponsorName = "Netflix",
        category = "Movies & TV Series",
        title = "Netflix – Unlimited Blockbuster Movies & TV Shows",
        description = "Watch anywhere. Cancel anytime. Download your favorite shows in 4K HDR & Dolby Atmos to watch on the go.",
        callToAction = "Watch Now",
        actionUrl = "https://www.netflix.com",
        packageName = "com.netflix.mediaclient",
        deepLinkUri = "nflx://",
        badge = "HOT",
        rating = "4.7 ★ (1B+ Downloads)",
        brandColor = 0xFFE50914,
        gradientColors = listOf(0xFFE50914, 0xFF450A0A)
    ),

    // 7. Disney+ Hotstar
    AdCampaign(
        id = "ad_hotstar",
        brandKey = "hotstar",
        sponsorName = "Disney+ Hotstar",
        category = "Live Sports & Cinema",
        title = "Live Cricket Tournaments, Marvel Hits & Specials",
        description = "Experience high-octane live sports in Ultra HD, exclusive Marvel Cinematic Universe movies, and award-winning dramas.",
        callToAction = "Subscribe Now",
        actionUrl = "https://www.hotstar.com",
        packageName = "in.startv.hotstar",
        deepLinkUri = "hotstar://",
        badge = "LIVE SPORTS",
        rating = "4.5 ★ (500M+ Downloads)",
        brandColor = 0xFF0063E5,
        gradientColors = listOf(0xFF0C2050, 0xFF0284C7)
    ),

    // 8. Google Gemini AI
    AdCampaign(
        id = "ad_gemini",
        brandKey = "gemini",
        sponsorName = "Google Gemini",
        category = "AI Assistant",
        title = "Gemini AI – Your Creative & Musical Super-Assistant",
        description = "Compose song lyrics, organize playlists, brainstorm new projects, and discover knowledge with Google's most advanced AI.",
        callToAction = "Chat with Gemini",
        actionUrl = "https://gemini.google.com",
        packageName = "com.google.android.apps.bard",
        deepLinkUri = null,
        badge = "AI INNOVATION",
        rating = "4.8 ★ (100M+ Users)",
        brandColor = 0xFF4285F4,
        gradientColors = listOf(0xFF4285F4, 0xFF7C3AED)
    ),

    // 9. WhatsApp Messenger
    AdCampaign(
        id = "ad_whatsapp",
        brandKey = "whatsapp",
        sponsorName = "WhatsApp",
        category = "Private Messaging",
        title = "WhatsApp – Simple, Secure Messaging & HD Audio Calls",
        description = "Keep in touch with friends and family worldwide with end-to-end encryption, HD voice notes, and group video calls.",
        callToAction = "Open WhatsApp",
        actionUrl = "https://www.whatsapp.com",
        packageName = "com.whatsapp",
        deepLinkUri = "whatsapp://",
        badge = "TOP FREE",
        rating = "4.6 ★ (5B+ Downloads)",
        brandColor = 0xFF25D366,
        gradientColors = listOf(0xFF25D366, 0xFF065F46)
    ),

    // 10. Apple Music
    AdCampaign(
        id = "ad_apple_music",
        brandKey = "apple_music",
        sponsorName = "Apple Music",
        category = "Hi-Res Lossless Audio",
        title = "Spatial Audio with Dolby Atmos & Pure Lossless",
        description = "Immerse yourself in over 100 million songs in studio-quality 24-bit/192kHz resolution with expertly curated playlists.",
        callToAction = "Try 1 Month Free",
        actionUrl = "https://music.apple.com",
        packageName = "com.apple.android.music",
        deepLinkUri = null,
        badge = "24-BIT MASTER",
        rating = "4.6 ★ (100M+ Downloads)",
        brandColor = 0xFFFA243C,
        gradientColors = listOf(0xFFFA243C, 0xFF991B1B)
    ),

    // 11. Flipkart Big Mega Sale
    AdCampaign(
        id = "ad_flipkart",
        brandKey = "flipkart",
        sponsorName = "Flipkart",
        category = "Electronics & Audio",
        title = "Big Mega Sale – Up to 80% Off Hi-Fi Sound & Gear",
        description = "Massive festive discounts on wireless ANC earbuds, Hi-Res DACs, audiophile headphones, smartphones, and fashion.",
        callToAction = "Shop Festive Deals",
        actionUrl = "https://www.flipkart.com",
        packageName = "com.flipkart.android",
        deepLinkUri = null,
        badge = "MEGA SALE",
        rating = "4.5 ★ (500M+ Downloads)",
        brandColor = 0xFF2874F0,
        gradientColors = listOf(0xFF2874F0, 0xFFD97706)
    ),

    // 12. Nike Running & Sports
    AdCampaign(
        id = "ad_nike",
        brandKey = "nike",
        sponsorName = "Nike",
        category = "Sportswear & Performance",
        title = "Nike Air Zoom & Pro Running Essentials",
        description = "Engineered for pure energy return and featherlight breathability. Train to the beat of your favorite music.",
        callToAction = "Shop Collection",
        actionUrl = "https://www.nike.com",
        packageName = "com.nike.omega",
        deepLinkUri = null,
        badge = "TRENDING",
        rating = "4.8 ★ (50M+ Downloads)",
        brandColor = 0xFF111827,
        gradientColors = listOf(0xFF1F2937, 0xFF374151)
    ),

    // 13. Bose QuietComfort Ultra ANC Headphones
    AdCampaign(
        id = "ad_bose_qc",
        brandKey = "bose",
        sponsorName = "Bose Audio",
        category = "Hardware & Hi-Fi",
        title = "Bose QuietComfort Ultra Noise Cancelling",
        description = "World-class noise cancellation, breakthrough spatialized audio, and elevated acoustic design. Experience sound made real.",
        callToAction = "Shop Bose",
        actionUrl = "https://www.bose.com",
        packageName = "com.bose.bosemusic",
        deepLinkUri = null,
        badge = "SPONSORED",
        rating = "4.9 ★ (Hi-Fi Choice)",
        brandColor = 0xFF000000,
        gradientColors = listOf(0xFF1E293B, 0xFF0F172A)
    ),

    // 14. Spotify Free vs Premium
    AdCampaign(
        id = "ad_spotify_stream",
        brandKey = "spotify",
        sponsorName = "Spotify",
        category = "Music & Podcasts",
        title = "Spotify – Millions of Songs & Podcasts Free",
        description = "Discover new music, playlists, podcasts and daily mixes tailored specifically to your taste. Listen anywhere, anytime.",
        callToAction = "Get Spotify Free",
        actionUrl = "https://www.spotify.com",
        packageName = "com.spotify.music",
        deepLinkUri = "spotify://",
        badge = "VERIFIED",
        rating = "4.8 ★ (1B+ Downloads)",
        brandColor = 0xFF1DB954,
        gradientColors = listOf(0xFF1DB954, 0xFF15803D)
    )
)

/**
 * Custom stylized brand logo/badge tailored to each iconic real-world brand
 */
@Composable
fun BrandLogoBadge(
    brandKey: String,
    brandColor: Long,
    modifier: Modifier = Modifier
) {
    val baseColor = Color(brandColor)

    Surface(
        modifier = modifier.size(44.dp),
        shape = RoundedCornerShape(12.dp),
        color = baseColor,
        shadowElevation = 4.dp
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            when (brandKey) {
                "facebook" -> {
                    Text(
                        text = "f",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black
                    )
                }
                "youtube" -> {
                    // YouTube play triangle on rounded red rect
                    Box(
                        modifier = Modifier
                            .size(24.dp, 18.dp)
                            .clip(RoundedCornerShape(5.dp))
                            .background(Color.White),
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.size(10.dp)) {
                            val path = Path().apply {
                                moveTo(0f, 0f)
                                lineTo(size.width, size.height / 2f)
                                lineTo(0f, size.height)
                                close()
                            }
                            drawPath(path, color = Color.Red)
                        }
                    }
                }
                "instagram" -> {
                    // Instagram gradient + camera outline
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.linearGradient(
                                    listOf(Color(0xFF833AB4), Color(0xFFFD1D1D), Color(0xFFF77737))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.size(22.dp)) {
                            drawRoundRect(
                                color = Color.White,
                                size = size,
                                cornerRadius = androidx.compose.ui.geometry.CornerRadius(6.dp.toPx()),
                                style = Stroke(width = 2.dp.toPx())
                            )
                            drawCircle(
                                color = Color.White,
                                radius = 4.5.dp.toPx(),
                                center = center,
                                style = Stroke(width = 2.dp.toPx())
                            )
                            drawCircle(
                                color = Color.White,
                                radius = 1.2.dp.toPx(),
                                center = Offset(size.width * 0.75f, size.height * 0.25f)
                            )
                        }
                    }
                }
                "spotify" -> {
                    Canvas(modifier = Modifier.size(22.dp)) {
                        drawCircle(color = Color.White.copy(alpha = 0.15f), radius = size.width / 2f)
                        val strokeW = 2.5.dp.toPx()
                        // 3 arcs
                        drawArc(
                            color = Color.Black,
                            startAngle = 210f,
                            sweepAngle = 75f,
                            useCenter = false,
                            style = Stroke(width = strokeW, cap = StrokeCap.Round)
                        )
                        drawArc(
                            color = Color.Black,
                            startAngle = 210f,
                            sweepAngle = 65f,
                            useCenter = false,
                            topLeft = Offset(2.dp.toPx(), 4.dp.toPx()),
                            size = androidx.compose.ui.geometry.Size(size.width - 4.dp.toPx(), size.height - 4.dp.toPx()),
                            style = Stroke(width = strokeW * 0.9f, cap = StrokeCap.Round)
                        )
                        drawArc(
                            color = Color.Black,
                            startAngle = 210f,
                            sweepAngle = 55f,
                            useCenter = false,
                            topLeft = Offset(4.dp.toPx(), 8.dp.toPx()),
                            size = androidx.compose.ui.geometry.Size(size.width - 8.dp.toPx(), size.height - 8.dp.toPx()),
                            style = Stroke(width = strokeW * 0.8f, cap = StrokeCap.Round)
                        )
                    }
                }
                "netflix" -> {
                    Text(
                        text = "N",
                        color = Color.White,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
                "amazon" -> {
                    Icon(
                        imageVector = Icons.Default.ShoppingCart,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
                "hotstar" -> {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(24.dp)
                    )
                }
                "gemini" -> {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
                "whatsapp" -> {
                    Icon(
                        imageVector = Icons.Default.Chat,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
                "apple_music" -> {
                    Icon(
                        imageVector = Icons.Default.MusicNote,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
                "flipkart" -> {
                    Icon(
                        imageVector = Icons.Default.ShoppingBag,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
                "bose" -> {
                    Icon(
                        imageVector = Icons.Default.Headphones,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
                else -> {
                    Icon(
                        imageVector = Icons.Default.Stars,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }
    }
}

/**
 * Launch the requested campaign:
 * 1. Checks if native app is installed (e.g. Facebook, YouTube, Instagram) and opens it directly
 * 2. If not installed, falls back to the official web URL in browser
 */
private fun launchCampaign(context: Context, uriHandler: androidx.compose.ui.platform.UriHandler, campaign: AdCampaign) {
    var launched = false

    // Try deep link intent first if available
    if (!campaign.deepLinkUri.isNullOrBlank()) {
        try {
            val deepIntent = Intent(Intent.ACTION_VIEW, Uri.parse(campaign.deepLinkUri)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(deepIntent)
            launched = true
        } catch (e: Exception) {}
    }

    // Try package launch intent if available
    if (!launched && !campaign.packageName.isNullOrBlank()) {
        try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(campaign.packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            if (launchIntent != null) {
                context.startActivity(launchIntent)
                launched = true
            }
        } catch (e: Exception) {}
    }

    // Fallback: Open web URL in browser
    if (!launched) {
        try {
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(campaign.actionUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(browserIntent)
            launched = true
        } catch (e: Exception) {
            try {
                uriHandler.openUri(campaign.actionUrl)
                launched = true
            } catch (e: Exception) {}
        }
    }

    try {
        Toast.makeText(context, "Opening ${campaign.sponsorName}...", Toast.LENGTH_SHORT).show()
    } catch (e: Exception) {}
}

@Composable
fun RealAdBanner(
    modifier: Modifier = Modifier,
    campaignIndex: Int = 0,
    autoRotate: Boolean = true,
    compact: Boolean = false,
    onDismiss: (() -> Unit)? = null
) {
    var isDismissed by remember { mutableStateOf(false) }
    if (isDismissed) return

    val context = LocalContext.current
    val uriHandler = LocalUriHandler.current

    // Internal state allowing rotating and manual cycling through all campaigns
    var currentIdx by remember { mutableStateOf(campaignIndex % LIVE_AD_CAMPAIGNS.size) }

    // Auto-cycle through ads every 7 seconds if enabled
    LaunchedEffect(autoRotate) {
        if (autoRotate) {
            while (isActive) {
                delay(7000L)
                currentIdx = (currentIdx + 1) % LIVE_AD_CAMPAIGNS.size
            }
        }
    }

    val campaign = LIVE_AD_CAMPAIGNS[currentIdx % LIVE_AD_CAMPAIGNS.size]

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(20.dp))
            .clickable {
                launchCampaign(context, uriHandler, campaign)
            },
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
        color = Color(0xFF141418),
        tonalElevation = 6.dp
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        colors = campaign.gradientColors.map { Color(it).copy(alpha = 0.28f) } + listOf(Color(0xFF0F172A).copy(alpha = 0.85f))
                    )
                )
                .padding(14.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Top Row: Brand Logo, Name, Badge, Rating & Navigation / Close Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        BrandLogoBadge(
                            brandKey = campaign.brandKey,
                            brandColor = campaign.brandColor
                        )

                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = campaign.sponsorName,
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    ),
                                    color = Color.White
                                )

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

                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = Color.White.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = campaign.badge,
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 9.sp
                                        ),
                                        color = Color.White.copy(alpha = 0.9f),
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(2.dp))

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = campaign.rating,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    ),
                                    color = Color(0xFFFCD34D)
                                )
                                Text(
                                    text = "• ${campaign.category}",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontSize = 11.sp
                                    ),
                                    color = Color.LightGray.copy(alpha = 0.8f)
                                )
                            }
                        }
                    }

                    // Dismiss button only
                    IconButton(
                        onClick = {
                            isDismissed = true
                            onDismiss?.invoke()
                        },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close Ad",
                            tint = Color.Gray,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Title & Description
                Text(
                    text = campaign.title,
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    ),
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(3.dp))

                Text(
                    text = campaign.description,
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    ),
                    color = Color(0xFFCBD5E1),
                    maxLines = if (compact) 1 else 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Bottom Row: Clean sponsored label and Primary Action Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Sponsored",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        ),
                        color = Color.LightGray.copy(alpha = 0.6f)
                    )

                    // CTA Button with brand styling
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Color(campaign.brandColor),
                        shadowElevation = 4.dp,
                        modifier = Modifier.clickable {
                            launchCampaign(context, uriHandler, campaign)
                        }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                        ) {
                            Text(
                                text = campaign.callToAction,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                ),
                                color = Color.White
                            )
                            Icon(
                                imageVector = Icons.Default.OpenInNew,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
