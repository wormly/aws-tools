
export AWS_INSTANCE=`curl -s http://169.254.169.254/latest/meta-data/instance-id`
export AWS_REGION=`curl -s http://169.254.169.254/latest/dynamic/instance-identity/document|grep region|awk -F\" '{print $4}'`
export AWS_AZ=`curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone`