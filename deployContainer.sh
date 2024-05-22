while getopts k:h:s:a: flag
do
    case "${flag}" in
        s) jwtAuthSecret=${OPTARG};;
        k) factoryApiKey=${OPTARG};;
        h) hostname=${OPTARG};;
        a) awsAccount=${OPTARG};;
    esac
done

if [[ -z "$factoryApiKey" || -z "$hostname" || -z "$jwtAuthSecret" || -z "$awsAccount" ]]; then
    printf "\nMissing required parameter.\n"
    printf "  syntax: deployService.sh -a <aws account> -s <jwt auth secret> -k <factory API key> -h <hostname>\n\n"
    exit 1
fi

service="jwt-pizza-service"
version=$(date +"%Y%m%d.%H%M%S")

printf "\n----> Containizing $service version $version\n"


# Step 1
printf "\n----> Building the distribution package\n"
rm -rf dist
mkdir dist
cp Dockerfile dist
cp -r src/* dist
cp *.json dist


# Step 2
printf "\n----> Building container\n"
pushd dist
printf '{"version": "%s" }' $(date +'%Y%m%d.%H%M%S') > version.json
printf "module.exports={jwtSecret:'${jwtAuthSecret}',db:{connection:{host:'${hostname}',user:'root',password:'monkeypie',database:'pizza',connectTimeout:60000}},factory:{url:'https://jwt-pizza-factory.cs329.click', apiKey:'${factoryApiKey}'}};" > config.json
docker build --platform=linux/arm64 -t $service .
popd


# Step 5
printf "\n----> Removing local copy of the distribution package\n"
rm -rf dist


# Step 6
printf "\n----> Deploy to AWS ECR\n"
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin ${awsAccount}.dkr.ecr.us-east-2.amazonaws.com
docker tag ${service}:latest ${awsAccount}.dkr.ecr.us-east-2.amazonaws.com/${service}:latest
docker push ${awsAccount}.dkr.ecr.us-east-2.amazonaws.com/${service}:latest