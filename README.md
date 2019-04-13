
# grafana-simplejson-gateway

API server for the Grafana [SimpleJson plugin](https://grafana.com/plugins/grafana-simple-json-datasource). This [NestJS](https://nestjs.com/) based project enables you to serve database data (using [TypeORM](https://typeorm.io/) + appropriate database drivers installed) or external API data for display in your Grafana dashboard.


## Requirements

* docker
* docker-compose
* make


## Usage
```
git clone git@github.com:shirish87/grafana-simplejson-gateway.git
cd grafana-simplejson-gateway
make deploy
```
> Run `make help` to see more docker container management options.

* Create a new Grafana datasource pointing to `http://localhost:3000`
* Add a `Table` or `Graph` panel to your dashboard
* Add a new metric using above datasource and search for `Dummy` metric

## Sample Data
See `app/src/dummy/dummy.service.ts`


## Create New Data Source

* Install the NestJS CLI on the host machine with `npm i -g @nestjs/cli`

```
cd app
nest g module my-data
nest g service my-data
```

* Edit `app/src/my-data/my-data.module.ts` to have the following contents:

```ts
import { Module } from '@nestjs/common';
import { MyDataService } from './my-data.service';
import { CommonModule } from '../common/common.module'; // added

@Module({
  imports: [CommonModule], // added
  providers: [MyDataService]
})
export class MyDataModule {}
```

* Update `app/src/my-data/my-data.service.ts` based on notes in `app/src/dummy/dummy.service.ts`

* Please see [NestJS/TypeORM docs](https://docs.nestjs.com/techniques/database) and `app/src/ormconfig.js` to query database(s)


## Docker Configuration

* Set environment variable `PROJECT_NAME` in `project.env`. This serves as a prefix for the resultant docker containers
* Configure ports in `docker-compose.yml` (production) or `docker-compose.dev.yml` (development)


## Start in Development Mode
```
make deploy-dev
make shell-dev
dev
```


## Start in Production Mode
```
make deploy
```
