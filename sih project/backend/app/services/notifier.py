import smtplib
import ssl
import logging
import os
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.request
import urllib.parse
import json

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv('SMTP_HOST', '')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM = os.getenv('SMTP_FROM', 'alerts@medisentinel.gov.in')

SMS_API_KEY = os.getenv('SMS_API_KEY', '')
SMS_SENDER_ID = os.getenv('SMS_SENDER_ID', 'IDSPOD')


def send_email_otp_async(to_email: str, otp: str, purpose: str = 'Registration'):
    def _send():
        try:
            subject = f'MEDISENTINEL IDSP - Your {purpose} Verification Code: {otp}'
            
            html_body = f'''
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 540px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; }}
                .badge {{ display: inline-block; background-color: #0284c7; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }}
                .header {{ text-align: center; margin-bottom: 24px; }}
                .title {{ font-size: 20px; font-weight: 800; color: #38bdf8; margin: 12px 0 4px 0; }}
                .subtitle {{ font-size: 12px; color: #94a3b8; margin: 0; }}
                .otp-box {{ background: linear-gradient(135deg, #0f172a, #022c22); border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
                .otp-code {{ font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #34d399; font-family: monospace; }}
                .notice {{ font-size: 12px; color: #cbd5e1; line-height: 1.6; }}
                .footer {{ text-align: center; margin-top: 32px; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }}
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <span class="badge">National Health Mission • IDSP Odisha</span>
                  <div class="title">MEDISENTINEL Portal Verification</div>
                  <p class="subtitle">Community-Level Health Risk & Outbreak Early Warning Platform</p>
                </div>
                
                <div class="notice">
                  <p>Hello,</p>
                  <p>You have requested a 6-digit verification code to complete your <strong>{purpose}</strong> on the MEDISENTINEL Epidemic Early Warning Surveillance platform.</p>
                </div>

                <div class="otp-box">
                  <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; font-weight: 600;">Your 6-Digit One Time Password (OTP)</div>
                  <div class="otp-code">{otp}</div>
                  <div style="font-size: 11px; color: #fbbf24; margin-top: 8px;">⏱️ Valid for 5 minutes only</div>
                </div>

                <div class="notice">
                  <p>🔒 <strong>Security Warning:</strong> Please do not share this OTP with anyone. MEDISENTINEL / Health Dept officials will never ask for your password or OTP.</p>
                  <p>If you did not initiate this request, please disregard this email.</p>
                </div>

                <div class="footer">
                  <p>© Integrated Disease Surveillance Programme (IDSP) • Health & Family Welfare Dept, Govt of Odisha</p>
                  <p>"YOUR HEALTH, OUR WATCH"</p>
                </div>
              </div>
            </body>
            </html>
            '''

            if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = SMTP_FROM
                msg['To'] = to_email
                
                part_text = MIMEText(f'Your MEDISENTINEL verification code is: {otp}. Valid for 5 minutes. Do not share.', 'plain')
                part_html = MIMEText(html_body, 'html')
                msg.attach(part_text)
                msg.attach(part_html)

                context = ssl.create_default_context()
                if SMTP_PORT == 465:
                    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.sendmail(SMTP_FROM, [to_email], msg.as_string())
                else:
                    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                        server.starttls(context=context)
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.sendmail(SMTP_FROM, [to_email], msg.as_string())
                print(f"\n{'='*65}\n [EMAIL OTP DISPATCHED VIA SMTP] To: {to_email}\n OTP Code: [ {otp} ] (Valid for 5 mins)\n{'='*65}\n", flush=True)
                logger.info(f'[EMAIL DISPATCH SUCCESS] Sent OTP to {to_email}')
            else:
                print(f"\n{'='*65}\n [DEV EMAIL OTP DISPATCH] To: {to_email}\n Verification Code: [ {otp} ]\n (Add SMTP credentials in .env to deliver live email to inbox)\n{'='*65}\n", flush=True)
                logger.info(f'[SIMULATED EMAIL DISPATCH] Sent OTP to {to_email}')
        except Exception as e:
            print(f"\n[EMAIL DISPATCH ERROR] Failed to send to {to_email}: {e}\n", flush=True)
            logger.error(f'[EMAIL DISPATCH ERROR] Failed to send email to {to_email}: {e}')

    threading.Thread(target=_send, daemon=True).start()


def send_sms_otp_async(phone_number: str, otp: str, purpose: str = 'Registration'):
    def _send():
        try:
            clean_phone = ''.join(filter(str.isdigit, phone_number))
            if len(clean_phone) > 10:
                clean_phone = clean_phone[-10:]

            message = f'Your MEDISENTINEL IDSP verification code is {otp}. Valid for 5 mins. Do not share. - Govt of Odisha Health Dept'

            if SMS_API_KEY:
                # Fast2SMS Indian Telecom SMS Gateway
                url = 'https://www.fast2sms.com/dev/bulkV2'
                data = urllib.parse.urlencode({
                    'authorization': SMS_API_KEY,
                    'route': 'otp',
                    'variables_values': otp,
                    'flash': '0',
                    'numbers': clean_phone,
                }).encode('utf-8')
                
                req = urllib.request.Request(url, data=data, headers={'cache-control': 'no-cache'})
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_body = response.read().decode('utf-8')
                    print(f"\n{'='*65}\n [SMS SENT TO MOBILE PHONE] To: +91-{clean_phone}\n OTP Code: [ {otp} ]\n Gateway Response: {res_body}\n{'='*65}\n", flush=True)
                    logger.info(f'[SMS DISPATCH SUCCESS] Dispatched to {clean_phone}: {res_body}')
            else:
                print(f"\n{'='*65}\n [DEV MOBILE SMS DISPATCH] To: +91-{clean_phone}\n Verification Code: [ {otp} ]\n (Add Fast2SMS key in .env to deliver live SMS to mobile phone)\n{'='*65}\n", flush=True)
                logger.info(f'[SMS DISPATCH PREPARED] To: +91-{clean_phone} | Message: {message}')
        except Exception as e:
            print(f"\n[SMS DISPATCH ERROR] Failed to send SMS to {phone_number}: {e}\n", flush=True)
            logger.error(f'[SMS DISPATCH ERROR] Failed to send SMS to {phone_number}: {e}')

    threading.Thread(target=_send, daemon=True).start()
