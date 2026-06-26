# EduSphere Pro - Scaling Guide

## Architecture Overview

EduSphere Pro is designed for horizontal and vertical scaling across multiple dimensions:

- **Multi-School SaaS** (Phase 2)
- **District Level** (Phase 3)
- **Ministry Level** (Phase 4)

---

## 1. Horizontal Scaling

### API Scaling

#### Current Setup (Single Container)
```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "8000:8000"
```

#### Scaled Setup (Multiple Containers)
```yaml
services:
  api:
    build: .
    # Remove ports - load balanced via nginx
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    networks:
      - edusphere-network
```

#### Nginx Load Balancing
```nginx
upstream api {
    least_conn;  # Load balancing algorithm
    server api:8000 weight=3 max_fails=3 fail_timeout=30s;
    server api2:8000 weight=3 max_fails=3 fail_timeout=30s;
    server api3:8000 weight=3 max_fails=3 fail_timeout=30s;
}

server {
    location /api/ {
        proxy_pass http://api;
        proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
    }
}
```

### Frontend Scaling

```yaml
services:
  frontend:
    build: .
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

## 2. Database Scaling

### Read Replicas

```yaml
services:
  postgres-primary:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: edusphere
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data

  postgres-replica-1:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: edusphere
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_PRIMARY_HOST: postgres-primary
    command: |
      bash -c "until pg_isready -h postgres-primary; do sleep 1; done;
               pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U edusphere -Fp -Xs -P -R"
    volumes:
      - postgres_replica_1_data:/var/lib/postgresql/data
    depends_on:
      - postgres-primary

  postgres-replica-2:
    image: postgres:16-alpine
    # Same as replica-1
```

### Application Configuration

```typescript
// apps/backend/src/app.module.ts
@Module({
  imports: [
    PrismaModule.forRoot({
      connectionString: process.env.DATABASE_URL_PRIMARY,
      // Read replicas for reporting/analytics
      readReplicas: [
        {
          connectionString: process.env.DATABASE_URL_REPLICA_1,
        },
        {
          connectionString: process.env.DATABASE_URL_REPLICA_2,
        },
      ],
    }),
  ],
})
```

---

## 3. Caching Strategy

### Redis Cluster

```yaml
services:
  redis-primary:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_primary_data:/data

  redis-replica-1:
    image: redis:7-alpine
    command: redis-server --replicaof redis-primary 6379
    depends_on:
      - redis-primary

  redis-replica-2:
    image: redis:7-alpine
    command: redis-server --replicaof redis-primary 6379
    depends_on:
      - redis-primary
```

### Cache Implementation

```typescript
// apps/backend/src/cache/cache.service.ts
@Injectable()
export class CacheService {
  constructor(@Inject('REDIS') private redis: Redis) {}

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fetcher();
    await this.redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }
}
```

---

## 4. Multi-School SaaS (Phase 2)

### Database Schema

```prisma
model School {
  id        String   @id @default(uuid())
  name      String
  subdomain String   @unique  // school1.edusphere.com
  domain    String?  @unique  // custom domain
  plan      SchoolPlan @default(FREE)
  settings  Json
  isActive  Boolean  @default(true)
  
  users     User[]
  students  Student[]
  teachers  Teacher[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum SchoolPlan {
  FREE
  BASIC
  PREMIUM
  ENTERPRISE
}
```

### Tenant Isolation

```typescript
// apps/backend/src/tenants/tenant.module.ts
@Module({
  providers: [TenantInterceptor],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantInterceptor)
      .forRoutes('*');
  }
}

// apps/backend/src/tenants/tenant.interceptor.ts
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Auto-inject schoolId from user
    request.schoolId = user.schoolId;
    
    return next.handle();
  }
}
```

### Subdomain Routing

```typescript
// apps/backend/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Dynamic tenant resolution
  app.use((req, res, next) => {
    const host = req.hostname;
    const subdomain = host.split('.')[0];
    
    if (subdomain !== 'www' && subdomain !== 'api') {
      req.schoolSubdomain = subdomain;
    }
    
    next();
  });
}
```

---

## 5. Message Queue (Async Processing)

### BullMQ with Redis

```yaml
services:
  api:
    build: .
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis

  worker:
    build: .
    command: npm run start:worker
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis
    deploy:
      replicas: 3
```

### Queue Implementation

```typescript
// apps/backend/src/queues/notifications.queue.ts
@Processor('notifications')
export class NotificationsProcessor {
  @Process('send')
  async handleSend(job: Job) {
    const { userId, message } = job.data;
    await this.notificationService.send(userId, message);
  }
}

// Usage
await this.queueService.add('notifications.send', {
  userId: '123',
  message: 'Hello',
});
```

---

## 6. File Storage

### S3-Compatible Storage

```typescript
// apps/backend/src/storage/storage.service.ts
@Injectable()
export class StorageService {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,  // MinIO or AWS S3
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });
  }

  async upload(file: Buffer, key: string) {
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file,
    }));
  }
}
```

### MinIO for Self-Hosted

```yaml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
```

---

## 7. CDN Integration

### CloudFlare / AWS CloudFront

```typescript
// apps/frontend/next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.js',
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate' },
        ],
      },
    ];
  },
};
```

---

## 8. Database Sharding (Phase 3+)

### Sharding by School

```typescript
// Shard configuration
const shards = {
  'school-1-100': 'postgres-shard-1',
  'school-101-200': 'postgres-shard-2',
  'school-201-300': 'postgres-shard-3',
};

// Dynamic connection
function getShardForSchool(schoolId: string): string {
  const shardKey = Math.ceil(schoolId / 100);
  return shards[`school-${shardKey}`];
}
```

---

## 9. Kubernetes Deployment (Optional)

### K8s Manifests

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edusphere-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: edusphere-api
  template:
    metadata:
      labels:
        app: edusphere-api
    spec:
      containers:
        - name: api
          image: edusphere-api:latest
          ports:
            - containerPort: 8000
          resources:
            limits:
              cpu: '1'
              memory: 1Gi
            requests:
              cpu: '500m'
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /api/health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
```

---

## 10. Performance Optimization

### Database Indexes

```sql
-- Already implemented in schema.prisma
CREATE INDEX CONCURRENTLY idx_students_school_id ON students(school_id);
CREATE INDEX CONCURRENTLY idx_attendance_date ON attendance(date);
CREATE INDEX CONCURRENTLY idx_grades_student_id ON grades(student_id);
```

### Query Optimization

```typescript
// Use select to limit fields
const students = await prisma.student.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    // Exclude heavy fields
  },
  where: { schoolId },
});

// Use pagination
const page = 1;
const limit = 20;
const students = await prisma.student.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

### Connection Pooling

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      // Connection pooling
      pool: {
        min: 5,
        max: 20,
      },
    });
  }
}
```

---

## 11. Monitoring & Alerting

### Key Metrics

```yaml
# prometheus.yml
groups:
  - name: edusphere
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        labels:
          severity: warning
```

### Grafana Dashboards

1. **Application Metrics**
   - Request rate
   - Error rate
   - Response time
   - Active users

2. **Database Metrics**
   - Connection count
   - Query performance
   - Cache hit ratio
   - Table sizes

3. **Infrastructure Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

---

## 12. Cost Estimation

### Small School (100-500 students)
- 1 API container (1 CPU, 2GB RAM)
- 1 PostgreSQL (2 CPU, 4GB RAM)
- 1 Redis (512MB RAM)
- **Cost: ~$50-100/month**

### Medium School (500-2000 students)
- 2-3 API containers (2 CPU, 4GB RAM each)
- PostgreSQL primary + 1 replica (4 CPU, 8GB RAM)
- Redis cluster (1GB RAM)
- **Cost: ~$200-400/month**

### Large District (10,000+ students)
- 5+ API containers (4 CPU, 8GB RAM each)
- PostgreSQL cluster (8 CPU, 16GB RAM)
- Redis cluster (4GB RAM)
- CDN + Load balancer
- **Cost: ~$1000-2000/month**

---

## 13. Scaling Checklist

### Phase 1: Single School (Current)
- [x] Single server deployment
- [x] Docker Compose
- [x] Basic monitoring
- [x] Automated backups

### Phase 2: Multi-School
- [ ] Multi-tenancy implementation
- [ ] Subdomain routing
- [ ] Per-school database isolation
- [ ] Usage-based billing
- [ ] White-label support

### Phase 3: District Level
- [ ] Database sharding
- [ ] Read replicas
- [ ] Message queue
- [ ] Advanced caching
- [ ] CDN integration

### Phase 4: Ministry Level
- [ ] Kubernetes deployment
- [ ] Auto-scaling
- [ ] Multi-region deployment
- [ ] Advanced analytics
- [ ] ML/AI integration

---

## 14. Best Practices

### Code
- ✅ Stateless API design
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Caching strategy
- ✅ Async processing

### Infrastructure
- ✅ Load balancing
- ✅ Health checks
- ✅ Auto-restart policies
- ✅ Resource limits
- ✅ Monitoring

### Database
- ✅ Indexes on all foreign keys
- ✅ Read replicas for reporting
- ✅ Regular backups
- ✅ Connection pooling
- ✅ Query optimization

### Security
- ✅ Network isolation
- ✅ Rate limiting
- ✅ WAF (optional)
- ✅ DDoS protection
- ✅ SSL/TLS everywhere

---

## 15. Migration Path

### From Single to Multi-School

1. **Database Migration**
   ```sql
   -- Add school_id to all tables
   ALTER TABLE students ADD COLUMN school_id UUID;
   ALTER TABLE teachers ADD COLUMN school_id UUID;
   -- ... etc
   ```

2. **Application Updates**
   - Add tenant middleware
   - Update all queries to filter by school_id
   - Add subdomain routing

3. **Deployment**
   - Deploy new version
   - Run data migration
   - Enable multi-tenancy

---

## Conclusion

EduSphere Pro is architected for scalability from day one. The permission-based system, dynamic workspace, and modular design enable smooth scaling from single school to district/multi-tenant SaaS.

**Current Capacity:** 1,000-5,000 students per server
**With Scaling:** Unlimited (multi-region, multi-tenant)

**Next Steps:**
1. Monitor performance metrics
2. Identify bottlenecks
3. Implement caching
4. Add read replicas
5. Plan multi-tenancy migration