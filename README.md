# TestDocker

This project is used to test dockering a simple node/express/mongo/mongoose project. Two containers will be created by docker-compose: node and mongo respectively. Three public images are used: 

1. ubuntu (for mapping volume)
2. node:argon (for node/express/mongoose)
3. mongo (for mongod)


Below is how to test this project:

1. Clone this project
2. Install docker in your host computer
3. Install docker-compose in your host computer
4. Create a directory ~/myData/db and ~/myData/webData for saving mongo dabase files and web data.
5. CD to the cloned git repo directory
6. Run command in terminal: "sudo docker-compose up". if the program complains about docker, try to run "sudo service docker start" first.
7. Open a browser with url: http://localhost to test the web page. click "Sign In" to test the mongo db functinalities.


