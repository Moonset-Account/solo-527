//go:build ignore

package main

import (
	"crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"time"
)

var (
	services    = []string{"api-gateway", "user-svc", "order-svc", "payment-svc", "search-svc", "notification-svc"}
	levels      = []string{"DEBUG", "INFO", "INFO", "INFO", "WARN", "ERROR", "FATAL"}
	envs        = []string{"prod", "staging", "dev", "prod", "prod"}
	errorTypes  = []string{
		`database connection timeout after 30s`,
		`NullPointerException in UserController.getProfile for user_id=`,
		`Payment provider Stripe returned 429 Too Many Requests for order=`,
		`Elasticsearch index out_of_memory_exception on shard 3`,
		`gRPC deadline exceeded calling OrderService.Validate`,
		`Failed to send email via SMTP: connection refused`,
		`Invalid JWT signature in request from 10.0.`,
		`redis read ECONNRESET on key cart:`,
	}
	infoMsgs = []string{
		`request processed successfully in %dms`,
		`user %d logged in from 192.168.1.%d`,
		`cache hit for key product:%d`,
		`scheduled job cleanup completed, removed %d records`,
		`new order %s created, amount=%d.%02d USD`,
	}
)

func main() {
	outDir := flag.String("out", "./testdata", "输出目录")
	size := flag.String("count", "small", "夹具规模: small | large")
	flag.Parse()

	if err := os.MkdirAll(*outDir, 0o755); err != nil {
		panic(err)
	}

	switch *size {
	case "small":
		writeSmall(*outDir)
	case "large":
		writeLarge(*outDir)
	default:
		fmt.Fprintf(os.Stderr, "unknown -count %q\n", *size)
		os.Exit(2)
	}
}

func writeSmall(dir string) {
	writeFile(filepath.Join(dir, "mixed.log"), smallMixed())
	writeFile(filepath.Join(dir, "java_stacktrace.log"), smallJavaStacktrace())
	writeFile(filepath.Join(dir, "go_app.log"), smallGoStacktrace())
}

func writeLarge(dir string) {
	writeFile(filepath.Join(dir, "services.log"), largeMixed(100000))
}

func writeFile(path string, content string) {
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		panic(err)
	}
	fmt.Printf("wrote %s (%d bytes)\n", path, len(content))
}

func randInt(n int) int {
	i, _ := rand.Int(rand.Reader, big.NewInt(int64(n)))
	return int(i.Int64())
}

func randIntRange(lo, hi int) int {
	return lo + randInt(hi-lo)
}

func uuid() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%s-%s-%s-%s-%s",
		hex.EncodeToString(b[0:4]), hex.EncodeToString(b[4:6]),
		hex.EncodeToString(b[6:8]), hex.EncodeToString(b[8:10]), hex.EncodeToString(b[10:16]))
}

func smallMixed() string {
	var sb []string
	base := time.Now().Truncate(time.Hour)
	add := func(offsetMin int, lvl, svc, env, rid, msg string, extra ...string) {
		t := base.Add(time.Duration(offsetMin) * time.Minute)
		line := fmt.Sprintf("%s %s service=%s env=%s request_id=%s - %s",
			t.Format("2006-01-02T15:04:05.000Z07:00"), lvl, svc, env, rid, msg)
		sb = append(sb, line)
		for _, x := range extra {
			sb = append(sb, x)
		}
	}

	add(0, "INFO",  "api-gateway", "prod", uuid(), "Incoming request POST /api/v1/orders user_id=42")
	add(1, "INFO",  "order-svc",   "prod", "req-0001", "Validating order payload for user 42")
	add(2, "DEBUG", "order-svc",   "prod", "req-0001", "Inventory check passed, reserving stock")
	add(3, "ERROR", "payment-svc", "prod", "req-0001", errorTypes[2]+"ORD-12345",
		"  at com.payments.Provider.charge(Provider.java:127)",
		"  at com.payments.OrderService.pay(OrderService.java:48)",
		"  at com.api.OrderController.post(OrderController.java:210)",
	)
	add(5, "WARN",  "user-svc",    "prod", "req-0002", "Slow DB query took 2340ms for SELECT * FROM users WHERE id=123")
	add(6, "INFO",  "search-svc",  "prod", "req-0003", "Indexed document product:9923 in 12ms")
	add(7, "ERROR", "user-svc",    "prod", "req-0004", errorTypes[1]+"4231",
		"  at com.users.UserController.getProfile(UserController.java:78)",
		"  at com.users.UserController.get(UserController.java:32)",
	)
	add(8, "INFO",  "api-gateway", "staging", uuid(), "Health check /status 200 OK")
	add(9, "ERROR", "notification-svc", "prod", "req-0005", errorTypes[5])
	add(10, "FATAL", "search-svc", "prod", "req-0006", errorTypes[3])
	add(11, "ERROR", "api-gateway", "prod", "req-0007", errorTypes[0])
	add(12, "WARN",  "order-svc",    "staging", "req-0008", "Order 9999 retry count 3, backing off 5s")
	add(13, "INFO",  "payment-svc",  "dev", uuid(), "Webhook received from Stripe, event_id=evt_test")
	add(14, "ERROR", "api-gateway",  "prod", "req-0009", errorTypes[4])
	add(15, "INFO",  "order-svc",    "prod", "req-0010", "Order ORD-9990 finalized successfully")
	return joinLines(sb)
}

func smallJavaStacktrace() string {
	base := time.Now().Add(-3 * time.Hour)
	lines := []string{}
	full := `Exception in thread "main" java.lang.IllegalStateException: Failed to initialize cache
	at com.example.cache.CacheManager.init(CacheManager.java:42)
	at com.example.cache.CacheManager.getInstance(CacheManager.java:27)
	at com.example.Application.bootstrap(Application.java:88)
	at com.example.Application.main(Application.java:51)
Caused by: java.io.IOException: /var/cache/app: permission denied
	at java.base/java.io.RandomAccessFile.open0(Native Method)
	at java.base/java.io.RandomAccessFile.<init>(RandomAccessFile.java:288)
	at com.example.cache.DiskBackingStore.open(DiskBackingStore.java:39)
	at com.example.cache.CacheManager.init(CacheManager.java:39)
	... 3 more`
	lines = append(lines, fmt.Sprintf("%s ERROR service=worker env=prod request_id=%s - Bootstrap failed",
		base.Format("2006-01-02 15:04:05,000"), uuid()))
	for _, l := range splitLines(full) {
		lines = append(lines, l)
	}
	return joinLines(lines)
}

func smallGoStacktrace() string {
	base := time.Now().Add(-30 * time.Minute)
	lines := []string{}
	stack := `panic: runtime error: index out of range [5] with length 3

goroutine 23 [running]:
github.com/backend-ops/logsum/internal/core.(*Processor).processBatch(0xc00020e000, 0xc00019a000, 0x3, 0x3)
	/Users/dev/project/internal/core/processor.go:112 +0x1d2
github.com/backend-ops/logsum/internal/core.(*Processor).Run.func1()
	/Users/dev/project/internal/core/processor.go:48 +0x65
created by github.com/backend-ops/logsum/internal/core.(*Processor).Run
	/Users/dev/project/internal/core/processor.go:45 +0xe2`
	lines = append(lines, fmt.Sprintf(`%s FATAL service=batch-worker env=staging request_id=%s batch_id=b-1029 message="processing batch"`,
		base.Format("2006/01/02 15:04:05"), uuid()))
	for _, l := range splitLines(stack) {
		lines = append(lines, l)
	}
	return joinLines(lines)
}

func largeMixed(n int) string {
	base := time.Now().Add(-24 * time.Hour)
	step := time.Duration(24*60*60 / n) * time.Second
	sb := make([]string, 0, n)
	t := base
	for i := 0; i < n; i++ {
		svc := services[randInt(len(services))]
		lvl := levels[randInt(len(levels))]
		env := envs[randInt(len(envs))]
		rid := uuid()

		var msg string
		var extras []string
		switch lvl {
		case "ERROR", "FATAL":
			msg = errorTypes[randInt(len(errorTypes))]
			if msg[0:4] == "data" || msg[0:4] == "Null" || msg[0:5] == "Payme" || msg[0:5] == "Elast" {
				msg = msg + fmt.Sprintf("%d", randInt(99999))
			}
			if randInt(3) == 0 {
				extras = append(extras,
					fmt.Sprintf("  at org.example.%s.%s.%s(%s.java:%d)", svc, svc, "process", svc, 100+randInt(400)),
					fmt.Sprintf("  at org.example.%s.Router.handle(Router.java:%d)", svc, 20+randInt(90)),
				)
			}
		default:
			info := infoMsgs[randInt(len(infoMsgs))]
			switch randInt(5) {
			case 0:
				msg = fmt.Sprintf(info, randInt(2000))
			case 1:
				msg = fmt.Sprintf(info, randInt(10000), randInt(255))
			case 2:
				msg = fmt.Sprintf(info, randInt(99999))
			case 3:
				msg = fmt.Sprintf(info, randInt(50000))
			default:
				msg = fmt.Sprintf(info, fmt.Sprintf("ORD-%d", randInt(99999)), randInt(999), randInt(99))
			}
		}

		line := fmt.Sprintf("%s %s service=%s env=%s request_id=%s - %s",
			t.Format("2006-01-02T15:04:05.000Z"), lvl, svc, env, rid, msg)
		sb = append(sb, line)
		sb = append(sb, extras...)
		t = t.Add(step)
	}
	return joinLines(sb)
}

func splitLines(s string) []string {
	out := []string{}
	cur := ""
	for _, r := range s {
		if r == '\n' {
			out = append(out, cur)
			cur = ""
		} else {
			cur += string(r)
		}
	}
	if cur != "" {
		out = append(out, cur)
	}
	return out
}

func joinLines(ls []string) string {
	s := ""
	for _, l := range ls {
		s += l + "\n"
	}
	return s
}
