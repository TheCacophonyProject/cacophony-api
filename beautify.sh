find . -regextype posix-extended -regex '.*\.(ts|js)$' | egrep -v "./node_modules/*" | xargs prettier --write
