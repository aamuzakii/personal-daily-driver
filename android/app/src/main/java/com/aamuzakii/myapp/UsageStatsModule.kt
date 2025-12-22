package com.aamuzakii.myapp

import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.*
import android.app.NotificationChannel
import android.app.NotificationManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Calendar

class UsageStatsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val handler = Handler(Looper.getMainLooper())
    private var backgroundJob: Job? = null
    private var blockerJob: Job? = null
    private val CHANNEL_ID = "quran_tracking"

    override fun getName(): String {
        return "UsageStats"
    }

    private fun ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Quran Tracking"
            val descriptionText = "Notifications for Quran usage tracking"
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            val notificationManager: NotificationManager =
                reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showSuccessNotification(minutes: Int, responseCode: Int) {
        ensureNotificationChannel()
        val builder = NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setSmallIcon(reactContext.applicationInfo.icon)
            .setContentTitle("Quran usage sent")
            .setContentText("${minutes} min • API ${responseCode}")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setAutoCancel(true)

        with(NotificationManagerCompat.from(reactContext)) {
            notify(1001, builder.build())
        }
    }

    @ReactMethod
    fun getTwitterMinutes(promise: Promise) {
        try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val end = System.currentTimeMillis()
            val cal = Calendar.getInstance()
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            cal.firstDayOfWeek = Calendar.MONDAY
            cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
            val start = cal.timeInMillis

            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                start,
                end
            )

            var totalForeground = 0L

            stats?.forEach { usage ->
                if (usage.packageName == "com.android.chrome") {
                    totalForeground += if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        usage.totalTimeVisible
                    } else {
                        usage.totalTimeInForeground
                    }
                }
            }

            val minutes = totalForeground / 60000
            Log.d("UsageStatsModule", "Chrome totalForeground=" + totalForeground + " ms, minutes=" + minutes)

            // React Native bridge is happiest with Double for numbers
            promise.resolve(minutes.toDouble())

        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e)
        }
    }

    @ReactMethod
    fun getQuranMinutes(promise: Promise) {
        try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val end = System.currentTimeMillis()
            val cal = Calendar.getInstance()
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            cal.firstDayOfWeek = Calendar.MONDAY
            cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
            val start = cal.timeInMillis // last 24 hours

            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                start,
                end
            )

            var totalForeground = 0L

            stats?.forEach { usage ->
                if (usage.packageName == "com.quran.labs.androidquran") {
                    totalForeground += if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        usage.totalTimeVisible
                    } else {
                        usage.totalTimeInForeground
                    }
                }
            }

            val minutes = totalForeground / 60000
            Log.d("UsageStatsModule", "Quran totalForeground=" + totalForeground + " ms, minutes=" + minutes)

            promise.resolve(minutes.toDouble())

        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e)
        }
    }

    @ReactMethod
    fun openUsageAccessSettings() {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e("UsageStatsModule", "Failed to open usage access settings", e)
        }
    }

    @ReactMethod
    fun startBackgroundTracking() {
        try {
            // Cancel any existing job
            backgroundJob?.cancel()
            
            backgroundJob = CoroutineScope(Dispatchers.IO).launch {
                while (isActive) {
                    try {
                        val quranMinutes = getQuranMinutesInternal()
                        sendToApi(quranMinutes)
                        Log.d("UsageStatsModule", "Background tracking: Sent Quran minutes: $quranMinutes")
                    } catch (e: Exception) {
                        Log.e("UsageStatsModule", "Background tracking error", e)
                    }
                    
                    // Wait 5 minutes
                    delay(5 * 60 * 1000L)
                }
            }
            
            Log.d("UsageStatsModule", "Background tracking started")
        } catch (e: Exception) {
            Log.e("UsageStatsModule", "Failed to start background tracking", e)
        }
    }

    @ReactMethod
    fun stopBackgroundTracking() {
        try {
            backgroundJob?.cancel()
            backgroundJob = null
            Log.d("UsageStatsModule", "Background tracking stopped")
        } catch (e: Exception) {
            Log.e("UsageStatsModule", "Failed to stop background tracking", e)
        }
    }

    private fun getQuranMinutesInternal(): Double {
        val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val end = System.currentTimeMillis()
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        cal.firstDayOfWeek = Calendar.MONDAY
        cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
        val start = cal.timeInMillis // last 24 hours

        val stats = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            start,
            end
        )

        var totalForeground = 0L

        stats?.forEach { usage ->
            if (usage.packageName == "com.quran.labs.androidquran") {
                totalForeground += if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    usage.totalTimeVisible
                } else {
                    usage.totalTimeInForeground
                }
            }
        }

        val minutes = totalForeground / 60000
        Log.d("UsageStatsModule", "Quran totalForeground=$totalForeground ms, minutes=$minutes")
        
        return minutes.toDouble()
    }

    private fun sendToApi(minutes: Double) {
        try {
            val url = URL("https://home-dashboard-lac.vercel.app/api/quran/${minutes.toInt()}/210")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            
            val responseCode = connection.responseCode
            Log.d("UsageStatsModule", "API response code: $responseCode")
            if (responseCode in 200..299) {
                // Show a small success notification
                showSuccessNotification(minutes.toInt(), responseCode)
            }
            
            connection.disconnect()
        } catch (e: Exception) {
            Log.e("UsageStatsModule", "API request failed", e)
        }
    }


    private fun getChromeMinutesInternal(): Double {
        val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val end = System.currentTimeMillis()
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        cal.firstDayOfWeek = Calendar.MONDAY
        cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
        val start = cal.timeInMillis

        val stats = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            start,
            end
        )

        var totalForeground = 0L

        stats?.forEach { usage ->
            if (usage.packageName == "com.android.chrome") {
                totalForeground += if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    usage.totalTimeVisible
                } else {
                    usage.totalTimeInForeground
                }
            }
        }

        val minutes = totalForeground / 60000
        Log.d("UsageStatsModule", "Chrome totalForeground=$totalForeground ms, minutes=$minutes")

        return minutes.toDouble()
    }

    private fun getCurrentForegroundPackage(): String? {
        return try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val end = System.currentTimeMillis()
            val start = end - 30_000
            val events = usm.queryEvents(start, end)
            var lastEventPkg: String? = null
            val event = UsageEvents.Event()
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastEventPkg = event.packageName
                }
            }
            lastEventPkg
        } catch (e: Exception) {
            Log.e("UsageStatsModule", "getCurrentForegroundPackage failed", e)
            null
        }
    }

    private fun bringToHome() {
        try {
            val intent = Intent(Intent.ACTION_MAIN)
            intent.addCategory(Intent.CATEGORY_HOME)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e("UsageStatsModule", "Failed to bring to home", e)
        }
    }

    @ReactMethod
    fun startChromeBlocking() {
        startChromeBlockingWithLimit(1)
    }

    @ReactMethod
    fun startChromeBlockingWithLimit(limitMinutes: Int) {
        try {
            blockerJob?.cancel()
            blockerJob = CoroutineScope(Dispatchers.IO).launch {
                while (isActive) {
                    try {
                        val chromeMinutes = getChromeMinutesInternal()
                        val fg = getCurrentForegroundPackage()
                        Log.d("UsageStatsModule", "Blocker loop: minutes=" + chromeMinutes + ", fg=" + fg)
                        if (chromeMinutes >= limitMinutes && fg == "com.android.chrome") {
                            Log.d("UsageStatsModule", "Chrome limit reached ($chromeMinutes >= $limitMinutes). Sending to home.")
                            withContext(Dispatchers.Main) { bringToHome() }
                        }
                    } catch (e: Exception) {
                        Log.e("UsageStatsModule", "Blocker loop error", e)
                    }
                    delay(500L)
                }
            }
            Log.d("UsageStatsModule", "Chrome blocking started (limit=$limitMinutes min)")
        } catch (e: Exception) {
            Log.e("UsageStatsModule", "Failed to start Chrome blocking", e)
        }
    }

    @ReactMethod
    fun stopChromeBlocking() {
        try {
            blockerJob?.cancel()
            blockerJob = null
            Log.d("UsageStatsModule", "Chrome blocking stopped")
        } catch (e: Exception) {
            Log.e("UsageStatsModule", "Failed to stop Chrome blocking", e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for event emitter interface
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for event emitter interface
    }

    override fun invalidate() {
        super.invalidate()
        backgroundJob?.cancel()
        blockerJob?.cancel()
    }
}