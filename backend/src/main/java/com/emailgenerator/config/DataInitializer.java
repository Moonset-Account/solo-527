package com.emailgenerator.config;

import com.emailgenerator.entity.EmailTemplate;
import com.emailgenerator.entity.User;
import com.emailgenerator.repository.EmailTemplateRepository;
import com.emailgenerator.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmailTemplateRepository templateRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           EmailTemplateRepository templateRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        initUsers();
        initTemplates();
    }

    private void initUsers() {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRealName("系统管理员");
        admin.setRole("ADMIN");
        admin.setDepartment("技术部");
        admin.setEmail("admin@example.com");
        admin.setEnabled(true);
        userRepository.save(admin);

        User sales1 = new User();
        sales1.setUsername("sales1");
        sales1.setPassword(passwordEncoder.encode("123456"));
        sales1.setRealName("张销售");
        sales1.setRole("SALES");
        sales1.setDepartment("销售部");
        sales1.setEmail("sales1@example.com");
        sales1.setEnabled(true);
        userRepository.save(sales1);

        User legal1 = new User();
        legal1.setUsername("legal1");
        legal1.setPassword(passwordEncoder.encode("123456"));
        legal1.setRealName("李法务");
        legal1.setRole("LEGAL");
        legal1.setDepartment("法务部");
        legal1.setEmail("legal1@example.com");
        legal1.setEnabled(true);
        userRepository.save(legal1);
    }

    private void initTemplates() {
        if (templateRepository.count() > 0) {
            return;
        }

        EmailTemplate template1 = new EmailTemplate();
        template1.setName("新客户欢迎邮件");
        template1.setDescription("新注册用户的欢迎邮件模板");
        template1.setSubject("欢迎加入我们的平台！");
        template1.setContent("尊敬的{name}：\n\n您好！欢迎加入我们的平台！\n\n我们很高兴您成为我们的用户。您可以享受以下服务：\n1. 个性化邮件推送\n2. 专属客户经理服务\n3. 优先体验新功能\n\n如有任何问题，请随时联系我们。\n\n祝您使用愉快！\n\n{company} 团队");
        template1.setCategory("WELCOME");
        template1.setSource("MARKETING");
        template1.setOwner("张销售");
        template1.setLegalOwner("李法务");
        template1.setVersion(1);
        template1.setStatus("PUBLISHED");
        template1.setIsRisk(false);
        template1.setCreateBy("admin");
        template1.setUpdateBy("admin");
        templateRepository.save(template1);

        EmailTemplate template2 = new EmailTemplate();
        template2.setName("产品推广邮件");
        template2.setDescription("产品促销推广邮件模板");
        template2.setSubject("【限时优惠】精选产品低至5折！");
        template2.setContent("亲爱的{name}：\n\n您好！\n\n我们为您准备了专属优惠活动：\n\n🔥 限时特惠\n全场商品低至5折起，满299减50\n\n🎁 新客专享\n首次下单立减30元，再送精美礼品\n\n📅 活动时间\n即日起至本月底\n\n立即抢购，不要错过！\n\n{company} 运营团队");
        template2.setCategory("PROMOTION");
        template2.setSource("SALES");
        template2.setOwner("王经理");
        template2.setLegalOwner("李法务");
        template2.setVersion(2);
        template2.setStatus("PUBLISHED");
        template2.setIsRisk(false);
        template2.setCreateBy("admin");
        template2.setUpdateBy("admin");
        templateRepository.save(template2);

        EmailTemplate template3 = new EmailTemplate();
        template3.setName("订单确认邮件");
        template3.setDescription("用户下单后的确认邮件");
        template3.setSubject("订单确认 - 感谢您的购买");
        template3.setContent("尊敬的{name}：\n\n您好！\n\n感谢您的购买，您的订单已提交成功。\n\n订单详情：\n- 订单号：ORD20240101001\n- 订单金额：¥299.00\n- 预计送达：3-5个工作日\n\n您可以在个人中心查看订单详情。\n\n如有问题，请联系客服。\n\n{company} 客服团队");
        template3.setCategory("NOTIFICATION");
        template3.setSource("CUSTOMER_SERVICE");
        template3.setOwner("赵客服");
        template3.setLegalOwner("王法务");
        template3.setVersion(1);
        template3.setStatus("DRAFT");
        template3.setIsRisk(false);
        template3.setCreateBy("admin");
        template3.setUpdateBy("admin");
        templateRepository.save(template3);
    }
}
