# cacophony-api

cacophony-api is a Node server that provides an REST API server for
uploading, processing and retrieving media collected for the Cacophony
Project. This server used to be known as "Full_Noise".

## Setup

To run the server you will need create a PostgreSQL database and a S3
compatible service.

### S3 Service Setup

We recommend Minio for object storage.

* Download and install Minio from https://minio.io/downloads.html
  - The x64 download and install instructions are here:
    https://minio.io/downloads.html#download-server-linux-x64
* Create a bucket in minio called 'cacophony'
  - `wget https://dl.minio.io/client/mc/release/linux-amd64/mc`
  - `chmod +x mc`
  - `./mc config host add myminio http://127.0.0.1:9000 <private key> <public key> ` (Note this line is the same as the command-line printed out when you start minio)
  - `./mc mb myminio/cacophony`
* Once Minio is running, note the access key and secret key it
  generated, as well as the port it's running on (default is 9000)


### PostgreSQL Setup

A user account needs to be created within PostgreSQL as the owner of a
database. The PostGIS extension also needs to be enabled on that
database.

* Choose a PostgreSQL database name, username & password
* `sudo apt install postgresql-9.5 postgis --fix-missing`
* `sudo -i -u postgres`
* `psql`
* `CREATE USER [username] WITH PASSWORD '[password]';`
* `CREATE DATABASE [database] WITH OWNER [username];`
* `\c [database]`
* `CREATE EXTENSION postgis;`
* `\q`

### API Server Setup

* Install Node version 8 or later from http://nodejs.org/  (You will have probably have an older version of node installed but it won't build properly)
* `sudo apt install postgresql-server-dev-9.5`

* `git clone https://github.com/TheCacophonyProject/cacophony-api.git`
* `cd cacophony-api`
* `npm install`
* Create a configuration file for the API server by following the instructions in config/app_TEMPLATE.js
* `node_modules/.bin/sequelize db:migrate`
* Start server with `node Server.js`
* If you get errors then you may need to run `run npm install bcrypt` and/or `npm install node-pre-gyp`



### Generating API Documentation

* Install apiDoc `npm install apidoc -g`
* Generate API documentation with `apidoc -i api/V1/ -o apidoc/`


## Running in Virtual Box

If you want to continue using a different operating system (eg Windows/Mac OS X) then you can try running Linux in a Virtual Box.   This means you can edit the source files on your normal dev environment.  To do this:

### Install Ubuntu
* Download VirtualBox
* Download Ubuntu Server
* Install a Ubuntu server in VirtualBox (install ssh when doing this)
* Run `VBoxManage modifyvm "<vm name>" --natdnshostresolver1 on` to make the virtual box play nicely when you change wifi networks.

### SSH into Ubuntu the box 
It is much better to ssh in than use the default console which is awful. To get this working:
*  Open up port 2222 to ssh into.   Go to VirtualBox console, click Ubuntu server and navigate to Settings/Network/Adaptor1(NAT)/Port Forwarding
*  Add Ubuntu-SSH, host IP `127.0.0.1`, port `2222`, guest IP `10.0.2.15`, port `22`. 
*  ssh from host using `ssh -p 2222 <username>@127.0.0.1`

### To share the source code from the host(main) computer
* Check out files on your main computer eg to `<path>/cacophony`
* On VirtualBox console go to Settings/Shared Folder and add new share called `cacophony` with path `<path>/cacophony`.   Make it permanent and auto mount.
* Install Virtual Box guest addins on Ubuntu Virtual Box server (https://www.techrepublic.com/article/how-to-install-virtualbox-guest-additions-on-a-gui-less-ubuntu-server-host/ Remember you need to mount the cdrom drive with `sudo mount /dev/cdrom /media/cdrom` so you can see it.)
* Add your username to the vbox  usergroup so you can see the share `sudo usermod -a -G vboxsf <username>` then log out and log back in.
* Go to `/media/sf_cacophony` directory.  You should now be able to see and edit your files.
* Enable symlinks on the Ubuntu Vitual Box else the application can't build. On your host(main) computer run
  - `VBoxManage setextradata "<vm name>" VBoxInternal2/SharedFoldersEnableSymlinksCreate/cacophony 1`
  - Verify it worked by running `VBoxManage getextradata "<vm name>" enumerate`\
* Follow the above instructions to install cacophony.  All instructions should be run on the Ubuntu server except the git commands that should be run on on your host (main) environment.


## License

This project is licensed under the Affero General Public License
(https://www.gnu.org/licenses/agpl-3.0.en.html).
