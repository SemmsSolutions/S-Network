# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Supabase + Kotlin serialization
-keep class io.github.jan.supabase.** { *; }
-keepclassmembers class * {
    @kotlinx.serialization.SerialName <fields>;
}
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

# Google fonts
-keep class com.google.fonts.** { *; }

# File picker
-keep class com.mr.flutter.plugin.filepicker.** { *; }

# Shared preferences
-keep class io.flutter.plugins.sharedpreferences.** { *; }

# Geolocator
-keep class com.baseflow.geolocator.** { *; }

# Connectivity
-keep class dev.fluttercommunity.plus.connectivity.** { *; }

# Local notifications
-keep class com.dexterous.flutterlocalnotifications.** { *; }

# Keep all model classes
-keep class **.models.** { *; }
-keep class **.data.** { *; }

# Prevent stripping of Dart runtime reflection
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable
