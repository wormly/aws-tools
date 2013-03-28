
export AWS_INSTANCE=`curl http://169.254.169.254/latest/meta-data/instance-id`
export AWS_REGION=`curl http://169.254.169.254/latest/dynamic/instance-identity/document|grep region|awk -F\" '{print $4}'`