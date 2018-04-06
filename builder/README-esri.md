# Esri-specific info

Build this
Tag it with the same tag that is expected by the Jenkinsfile (ex: '2.9.4')
Push it to jeremyschneider/esri-dcdev

example:

```
JSchneiderMbpR2-1088:builder jere7054$ pwd
/Users/jere7054/Esri_Code/lighthouse-ci/builder
JSchneiderMbpR2-1088:builder jere7054$ docker build -t lighthouse-test .
Sending build context to Docker daemon  39.94kB
Step 1/19 : FROM node:8-slim
 ---> 71150592d86e
Step 2/19 : LABEL maintainer="Eric Bidelman <ebidel@>"
 ---> Using cache
 ---> 3290b95d6f2f
Step 3/19 : RUN apt-get update --fix-missing && apt-get -y upgrade
 ---> Using cache
 ---> c01d5d804350
Step 4/19 : RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'     && apt-get update     && apt-get install -y google-chrome-unstable --no-install-recommends     && rm -rf /var/lib/apt/lists/*     && rm -rf /src/*.deb
 ---> Using cache
 ---> 6a80a19b2b93
Step 5/19 : ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
Downloading   46.4kB/46.4kB
 ---> Using cache
 ---> b2f59759e47a
Step 6/19 : RUN chmod +x /usr/local/bin/dumb-init
 ---> Using cache
 ---> cb571e18c158
Step 7/19 : ARG CACHEBUST=1
 ---> Using cache
 ---> 9f1819befbb2
Step 8/19 : RUN npm i lighthouse -g
 ---> Using cache
 ---> 3576c9959c7e
Step 9/19 : COPY package.json .
 ---> Using cache
 ---> 707b8d17e86e
Step 10/19 : RUN npm i --production
 ---> Using cache
 ---> fb39c8faef04
Step 11/19 : COPY server.js /
 ---> Using cache
 ---> bf32535c932d
Step 12/19 : RUN chmod +x /server.js
 ---> Using cache
 ---> 588ce63e4251
Step 13/19 : COPY entrypoint.sh /
 ---> Using cache
 ---> 5e823c9ae75f
Step 14/19 : RUN chmod +x /entrypoint.sh
 ---> Using cache
 ---> d7ead9507236
Step 15/19 : RUN groupadd --system chrome &&     useradd --system --create-home --gid chrome --groups audio,video chrome &&     mkdir --parents /home/chrome/reports &&     chown --recursive chrome:chrome /home/chrome
 ---> Using cache
 ---> d44c33f60646
Step 16/19 : USER chrome
 ---> Using cache
 ---> 60db89407849
Step 17/19 : ENV CI=true
 ---> Using cache
 ---> 0dd39e65c63a
Step 18/19 : EXPOSE 8080
 ---> Using cache
 ---> 99c5d304279a
Step 19/19 : CMD ["lighthouse", "--help"]
 ---> Running in 6dc0343f5999
Removing intermediate container 6dc0343f5999
 ---> 9db250a583ca
Successfully built 9db250a583ca
Successfully tagged lighthouse-test:latest
JSchneiderMbpR2-1088:builder jere7054$ docker tag 9db250a583ca jeremyschneider/esri-dcdev:latest
JSchneiderMbpR2-1088:builder jere7054$ docker tag 9db250a583ca jeremyschneider/esri-dcdev:2.9.4
JSchneiderMbpR2-1088:builder jere7054$ docker push jeremyschneider/esri-dcdev
The push refers to repository [docker.io/jeremyschneider/esri-dcdev]
5e480fe5921a: Layer already exists
f85cede106c3: Layer already exists
7e026ccf92d6: Layer already exists
4f0bac2f03cd: Layer already exists
9b6664b875e2: Layer already exists
23f9c8ed47be: Layer already exists
06e0a4face3c: Layer already exists
03bccb6fe0d6: Layer already exists
6cdd680ef88f: Layer already exists
406ffa16e9d6: Layer already exists
7109dad72eb4: Layer already exists
eba46e01e1dc: Layer already exists
f3b0c90d596b: Layer already exists
3504b14871d6: Layer already exists
35c70c66c3d9: Layer already exists
18523e587478: Layer already exists
86985c679800: Layer already exists
8fad67424c4e: Layer already exists
2.9.4: digest: sha256:dcbab043b0e9c5844f82714ecf82b881c85642f314ed8919c0f7315c41dc9f52 size: 4093
5e480fe5921a: Layer already exists
f85cede106c3: Layer already exists
7e026ccf92d6: Layer already exists
4f0bac2f03cd: Layer already exists
9b6664b875e2: Layer already exists
23f9c8ed47be: Layer already exists
06e0a4face3c: Layer already exists
03bccb6fe0d6: Layer already exists
6cdd680ef88f: Layer already exists
406ffa16e9d6: Layer already exists
7109dad72eb4: Layer already exists
eba46e01e1dc: Layer already exists
f3b0c90d596b: Layer already exists
3504b14871d6: Layer already exists
35c70c66c3d9: Layer already exists
18523e587478: Layer already exists
86985c679800: Layer already exists
8fad67424c4e: Layer already exists
latest: digest: sha256:dcbab043b0e9c5844f82714ecf82b881c85642f314ed8919c0f7315c41dc9f52 size: 4093
JSchneiderMbpR2-1088:builder jere7054$
```

