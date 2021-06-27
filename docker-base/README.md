# docker-base

The code in here is used to build our docker base image.   This saves time when we are building the 
project on different platforms, and in particular on our build environment travis (where it build from the docker-base each time).

You may notice that some commands, eg npm install, are run on both the base image and again when the api container is built. 
This is by design.   By running the command on the base image it saves time as most of the packages are already installed.  By running the command again when the container is built it makes sure all needed packages are there as some packages may have been added or updated packages since the base image was built.

## How to update the base image. 

* Copy the latest packages list from [package.json](../package.json) to [docker-base/package.json](package.json)
* Build the image 
`sudo docker buildx build --platform linux/amd64 --no-cache . -t cacophonyproject/server-base:<tag>`
* Follow this guide to save an access token on your local docker installation that will allow you to push to dockerhub. (You need an account on dockerhub for this) https://docs.docker.com/docker-hub/access-tokens/
* Push the new version to dockerhub
`docker push cacophonyproject/server-base:<tag>`
* Update the project [Dockerfile](../Dockerfile) to use the new version of cacophonyproject/serverbase. 
* Delete all your images named cacophonyproject/server-base and test that ` npm run dev  ` downloads and uses the new version of the base image. 


## Useful docker commands

Command | Action
---|---
`docker ps -a `  or  `docker container -a ` | Lists all containers on your system
`docker container prune ` | Deletes all stopped containers on your system
`docker image -a ` | Lists all images on your system
`docker rmi <imagename> ` | Deletes a named image
`docker images --filter "dangling=true" ` | Lists all unnamed images on your system (intermediate images)
`docker rmi $(docker images --filter "dangling=true") `| Deletes all unnamed images on your system.  (Linux only)

