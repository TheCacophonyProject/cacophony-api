find . -regextype posix-extended -regex '.*\.(js)$' | egrep -v "./node_modules/*" | xargs prettier --write
