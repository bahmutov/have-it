set e+x

echo "Linking current have-it"
npm link

testFolder=`dirname $0`
echo "Test folder $testFolder"
sourceFolder=$PWD
echo "Current folder $sourceFolder"

HAVE=$HOME/git
echo "All existing projects live under $HAVE"

echo "Creating test folder"
folder=/tmp/test-have-it
rm -rf $folder
mkdir $folder
echo "Created test folder $folder"
cp $testFolder/index.js $folder

cd $folder
echo "Changed working dir to $folder"

echo "Creating new package"
npm init --yes

echo "Installing lodash using have-it"
DEBUG=have-it HAVE=$HAVE have lodash --save

echo "Package file after installing"
cat package.json

echo "Top level packages"
npm ls --depth=0

echo "Trying to use the program"
node index.js

echo "Uninstalling lodash"
npm uninstall --save lodash

echo "Installing lodash again - NPM install fallback"
DEBUG=have-it have lodash --save
echo "Trying to use the program"
node index.js

echo "All done testing have-it in $folder"
