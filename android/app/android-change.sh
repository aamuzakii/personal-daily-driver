# only use this in ubuntu
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
export NODE_ENV=development







pkill -f gradle || true

rm -rf android/app/build
rm -rf android/.gradle

npm install   # or yarn install

cd android
./gradlew clean
./gradlew assembleRelease





