find . -regextype posix-extended -regex '.*\.(ts|js)$' | egrep -v "(./node_modules/*|./apidoc*)" | xargs npx prettier --write
