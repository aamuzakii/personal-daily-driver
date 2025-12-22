pkill -f gradle || true

rm -rf android/app/build
rm -rf android/.gradle

npm install   # or yarn install

cd android
./gradlew clean
./gradlew assembleRelease