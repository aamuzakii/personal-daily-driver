package com.aamuzakii.myapp

import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*

class UsageStatsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UsageStats"
    }

    @ReactMethod
    fun getTwitterMinutes(promise: Promise) {
        try {
            val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val end = System.currentTimeMillis()
            val start = end - (24 * 60 * 60 * 1000) // last 24 hours

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
}