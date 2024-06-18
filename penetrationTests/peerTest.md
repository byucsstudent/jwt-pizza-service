# Penetration report

- Peer 1: 刘伟
- Peer 2: Dakota Jones
- Date: June 18, 2053

## 刘伟 Self attack

| Item           | Result                                                                               |
| -------------- | ------------------------------------------------------------------------------------ |
| Date           | June 18, 2053                                                                        |
| Target         | pizza.刘伟.click                                                                     |
| Classification | Injection                                                                            |
| Severity       | 1                                                                                    |
| Description    | SQL injection deleted database. All application data destroyed.                      |
| Images         | ![Unable to access db](deadDatabase.png) <br/> Stores and menu no longer accessible. |
| Corrections    | Sanitize user inputs.                                                                |

## Dakota Self attack

| Item           | Result                                         |
| -------------- | ---------------------------------------------- |
| Date           | June 18, 2053                                  |
| Target         | pizza.dakota.click                             |
| Classification | Security Misconfiguration                      |
| Severity       | 4                                              |
| Description    | Found picture of team cat.                     |
| Images         | ![Fifi](cat.png)                               |
| Corrections    | Deleted extra files from the public directory. |

## 刘伟 peer attack

| Item           | Result                                                                               |
| -------------- | ------------------------------------------------------------------------------------ |
| Date           | June 18, 2053                                                                        |
| Target         | pizza.dakota.click                                                                   |
| Classification | Injection                                                                            |
| Severity       | 1                                                                                    |
| Description    | SQL injection deleted database. All application data destroyed.                      |
| Images         | ![Unable to access db](deadDatabase.png) <br/> Stores and menu no longer accessible. |
| Corrections    | Sanitize user inputs.                                                                |

## Dakota peer attack

| Item           | Result                                            |
| -------------- | ------------------------------------------------- |
| Date           | June 18, 2053                                     |
| Target         | pizza.刘伟.click                                  |
| Classification | Security Misconfiguration                         |
| Severity       | 0                                                 |
| Description    | Looked for picture of cat, but nothing was there. |
| Images         |                                                   |
| Corrections    | None                                              |

## Combined learnings

During the penetration test, our team successfully identified and exploited vulnerabilities in the target system, demonstrating its susceptibility to potential attacks. By simulating real-world attack scenarios, we were able to gain unauthorized access to sensitive data and systems.

One of the key findings was a SQL injection vulnerability in the application, which allowed us to manipulate the database and delete critical information. This highlighted the importance of input validation and sanitization to prevent such attacks. We recommended implementing strict input validation measures and using parameterized queries to mitigate this risk.

Additionally, we discovered a security misconfiguration that exposed sensitive files and directories to unauthorized users. This misconfiguration could have potentially led to unauthorized access and data leakage. We advised the implementation of proper access controls and regular security audits to prevent similar incidents in the future.

Overall, the successful penetration test provided valuable insights into the security posture of the system. By identifying and addressing these vulnerabilities, the organization can enhance its security measures and protect against potential threats. It is crucial to regularly conduct penetration tests to proactively identify and remediate security weaknesses, ensuring the confidentiality, integrity, and availability of the system and its data.
