find . -regextype posix-extended -regex '.*\.(ts)$' | egrep -v "./node_modules/*" | xargs prettier --write
