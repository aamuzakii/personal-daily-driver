


ffmpeg -i "/Users/aamuzakii/Movies/au89.mov" -vn -acodec libmp3lame -q:a 2 "/Users/aamuzakii/Movies/au89.mp3"


cd /Users/aamuzakii/zaki/eject/my-app


pkill -f gradle
rm -rf android/.gradle/8.14.3/executionHistory/*.lock
# Kill Gradle/Java daemons
pkill -f gradle
pkill -f java

# Remove project build artifacts
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/app/.cxx
rm -rf node_modules/.cache

# Optional: remove global Gradle caches if low on space
rm -rf ~/.gradle/caches

# Reinstall dependencies
npm install  # or yarn install

cd android              
./gradlew clean                                      
./gradlew assembleRelease