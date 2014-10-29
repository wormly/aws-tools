
# echo 'aws-tools/update-env.sh was deprecated in favor of having aliases in /etc/profile.d/aws-aliases.sh'
# echo 'Usage: echo $(get_aws_instance) $(get_aws_region) $(get_aws_az)'

export AWS_INSTANCE=`curl -s http://169.254.169.254/latest/meta-data/instance-id`
export AWS_REGION=`curl -s http://169.254.169.254/latest/dynamic/instance-identity/document|grep region|awk -F\" '{print $4}'`
export AWS_AZ=`curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone`

