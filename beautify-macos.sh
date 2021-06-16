find -E . -iregex ".*\.(ts|js)" | egrep -v "(./node_modules/*|./apidoc*)" | xargs npx prettier --write
