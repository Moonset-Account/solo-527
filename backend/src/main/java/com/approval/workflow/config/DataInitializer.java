package com.approval.workflow.config;

import com.approval.workflow.entity.Department;
import com.approval.workflow.entity.User;
import com.approval.workflow.entity.WorkflowDefinition;
import com.approval.workflow.entity.WorkflowNode;
import com.approval.workflow.enums.RoleType;
import com.approval.workflow.repository.DepartmentRepository;
import com.approval.workflow.repository.UserRepository;
import com.approval.workflow.repository.WorkflowDefinitionRepository;
import com.approval.workflow.repository.WorkflowNodeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowNodeRepository workflowNodeRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(DepartmentRepository departmentRepository,
                            UserRepository userRepository,
                            WorkflowDefinitionRepository workflowDefinitionRepository,
                            WorkflowNodeRepository workflowNodeRepository,
                            PasswordEncoder passwordEncoder) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.workflowNodeRepository = workflowNodeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        initDepartments();
        initUsers();
        initWorkflows();
    }

    private void initDepartments() {
        if (departmentRepository.count() > 0) {
            return;
        }

        String[][] depts = {
            {"D001", "技术部", "技术研发部门"},
            {"D002", "产品部", "产品设计部门"},
            {"D003", "运营部", "运营推广部门"},
            {"D004", "市场部", "市场营销部门"},
            {"D005", "财务部", "财务管理部门"},
        };

        for (String[] dept : depts) {
            Department d = new Department();
            d.setDeptCode(dept[0]);
            d.setDeptName(dept[1]);
            d.setDescription(dept[2]);
            departmentRepository.save(d);
        }

        System.out.println("部门数据初始化完成");
    }

    private void initUsers() {
        if (userRepository.count() > 0) {
            return;
        }

        Department techDept = departmentRepository.findByDeptCode("D001").orElse(null);
        Department productDept = departmentRepository.findByDeptCode("D002").orElse(null);
        Department operationDept = departmentRepository.findByDeptCode("D003").orElse(null);

        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRealName("系统管理员");
        admin.setEmail("admin@example.com");
        admin.setRole(RoleType.ADMIN);
        admin.setDeptId(techDept != null ? techDept.getId() : null);
        userRepository.save(admin);

        User techManager = new User();
        techManager.setUsername("tech_manager");
        techManager.setPassword(passwordEncoder.encode("123456"));
        techManager.setRealName("技术部主管");
        techManager.setEmail("tech_manager@example.com");
        techManager.setRole(RoleType.DEPT_MANAGER);
        techManager.setDeptId(techDept != null ? techDept.getId() : null);
        userRepository.save(techManager);

        if (techDept != null) {
            techDept.setManagerId(techManager.getId());
            departmentRepository.save(techDept);
        }

        User productManager = new User();
        productManager.setUsername("product_manager");
        productManager.setPassword(passwordEncoder.encode("123456"));
        productManager.setRealName("产品部主管");
        productManager.setEmail("product_manager@example.com");
        productManager.setRole(RoleType.DEPT_MANAGER);
        productManager.setDeptId(productDept != null ? productDept.getId() : null);
        userRepository.save(productManager);

        if (productDept != null) {
            productDept.setManagerId(productManager.getId());
            departmentRepository.save(productDept);
        }

        User operationManager = new User();
        operationManager.setUsername("operation_manager");
        operationManager.setPassword(passwordEncoder.encode("123456"));
        operationManager.setRealName("运营部主管");
        operationManager.setEmail("operation_manager@example.com");
        operationManager.setRole(RoleType.DEPT_MANAGER);
        operationManager.setDeptId(operationDept != null ? operationDept.getId() : null);
        userRepository.save(operationManager);

        if (operationDept != null) {
            operationDept.setManagerId(operationManager.getId());
            departmentRepository.save(operationDept);
        }

        User user1 = new User();
        user1.setUsername("zhangsan");
        user1.setPassword(passwordEncoder.encode("123456"));
        user1.setRealName("张三");
        user1.setEmail("zhangsan@example.com");
        user1.setRole(RoleType.NORMAL);
        user1.setDeptId(operationDept != null ? operationDept.getId() : null);
        userRepository.save(user1);

        User user2 = new User();
        user2.setUsername("lisi");
        user2.setPassword(passwordEncoder.encode("123456"));
        user2.setRealName("李四");
        user2.setEmail("lisi@example.com");
        user2.setRole(RoleType.NORMAL);
        user2.setDeptId(techDept != null ? techDept.getId() : null);
        userRepository.save(user2);

        System.out.println("用户数据初始化完成");
        System.out.println("默认账号: admin / admin123 (管理员)");
        System.out.println("默认账号: tech_manager / 123456 (技术部主管)");
        System.out.println("默认账号: product_manager / 123456 (产品部主管)");
        System.out.println("默认账号: zhangsan / 123456 (普通员工-运营部)");
        System.out.println("默认账号: lisi / 123456 (普通员工-技术部)");
    }

    private void initWorkflows() {
        if (workflowDefinitionRepository.count() > 0) {
            return;
        }

        WorkflowDefinition wf = new WorkflowDefinition();
        wf.setName("标准审批流");
        wf.setDescription("标准的跨部门需求审批流程");
        wf.setActive(true);
        WorkflowDefinition savedWf = workflowDefinitionRepository.save(wf);

        Department techDept = departmentRepository.findByDeptCode("D001").orElse(null);
        Department productDept = departmentRepository.findByDeptCode("D002").orElse(null);

        String[][] nodes = {
            {"提交申请", "申请人提交需求", "1", "NORMAL", null, "1"},
            {"部门主管审批", "部门主管审核需求", "2", "DEPT_MANAGER", null, "3"},
            {"产品部评估", "产品部评估需求可行性", "3", "DEPT_MANAGER",
                productDept != null ? productDept.getId().toString() : null, "5"},
            {"技术部评估", "技术部评估开发工作量", "4", "DEPT_MANAGER",
                techDept != null ? techDept.getId().toString() : null, "5"},
            {"最终审批", "管理层最终审批", "5", "ADMIN", null, "3"},
        };

        for (int i = 0; i < nodes.length; i++) {
            WorkflowNode node = new WorkflowNode();
            node.setWorkflowId(savedWf.getId());
            node.setNodeName(nodes[i][0]);
            node.setNodeDescription(nodes[i][1]);
            node.setNodeOrder(Integer.parseInt(nodes[i][2]));
            node.setAssigneeRole(nodes[i][3]);
            if (nodes[i][4] != null) {
                node.setAssigneeDeptId(Long.parseLong(nodes[i][4]));
            }
            node.setDaysLimit(Integer.parseInt(nodes[i][5]));
            workflowNodeRepository.save(node);
        }

        System.out.println("工作流数据初始化完成");
    }
}
