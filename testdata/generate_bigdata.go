package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"time"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("用法: generate_bigdata <行数> [输出文件]")
		fmt.Println("示例: generate_bigdata 1000000 big_orders.csv")
		os.Exit(1)
	}
	n := 0
	fmt.Sscanf(os.Args[1], "%d", &n)
	if n <= 0 {
		fmt.Println("行数必须 > 0")
		os.Exit(1)
	}
	outFile := "big_orders.csv"
	if len(os.Args) >= 3 {
		outFile = os.Args[2]
	}
	f, err := os.Create(outFile)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	defer w.Flush()

	rand.Seed(time.Now().UnixNano())
	statuses := []string{"PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"}
	payments := []string{"ALIPAY", "WECHAT", "CREDIT_CARD", "COD"}
	cities := []string{"北京市朝阳区", "上海市浦东新区", "广州市天河区", "深圳市南山区", "杭州市西湖区", "成都市武侯区", "南京市鼓楼区", "武汉市江汉区"}

	fmt.Fprintln(w, "order_id,user_id,product_sku,quantity,unit_price,total_amount,order_date,status,payment_method,shipping_address,is_gift")

	errRate := 5
	pkDupRate := 10000
	for i := 1; i <= n; i++ {
		oid := fmt.Sprintf("ORD%010d", i)
		uid := fmt.Sprintf("USR%08d", rand.Intn(900000)+100000)
		sku := fmt.Sprintf("SKU-%c%03d", rune('A'+rand.Intn(20)), rand.Intn(900)+100)
		qty := rand.Intn(9) + 1
		up := float64(rand.Intn(90000)) / 100.0
		ta := up * float64(qty)
		dd := time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC).AddDate(0, 0, rand.Intn(730)).Format("2006-01-02")
		st := statuses[rand.Intn(len(statuses))]
		pm := payments[rand.Intn(len(payments))]
		addr := cities[rand.Intn(len(cities))] + fmt.Sprintf("某街道%d号", rand.Intn(999))
		gift := "false"
		if rand.Intn(10) == 0 {
			gift = "true"
		}
		if i%errRate == 0 {
			switch rand.Intn(6) {
			case 0:
				qty = 0
			case 1:
				st = "INVALID_STATUS"
			case 2:
				up = -10.5
			case 3:
				dd = "not-a-date"
			case 4:
				pm = "BAD_PAY"
			case 5:
				uid = ""
			}
		}
		if i%pkDupRate == 0 && i > pkDupRate {
			oid = fmt.Sprintf("ORD%010d", i-pkDupRate+1)
		}
		fmt.Fprintf(w, "%s,%s,%s,%d,%.2f,%.2f,%s,%s,%s,%s,%s\n",
			oid, uid, sku, qty, up, ta, dd, st, pm, addr, gift)
		if i%100000 == 0 {
			fmt.Printf("已写入 %d / %d 行 (%.1f%%)\n", i, n, float64(i)/float64(n)*100)
		}
	}
	fmt.Printf("生成完成: %s (共 %d 行)\n", outFile, n)
}
