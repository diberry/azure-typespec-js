npm i --force --no-package-lock

## generate opanapi spec and node middleward
tsp compile .

## node api server and build boilerplate
npx hsjs-scaffold 

npm install @typespec/compiler@next @typespec/http@next @typespec/rest@next @typespec/openapi@next @typespec/openapi3@next @typespec/http-server-js@next