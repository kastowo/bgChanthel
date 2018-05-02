echo "set up Xvfb.."
/usr/bin/pgrep Xvfb
if [[ ! -f /etc/systemd/system/xvfb.service || $? -ne 0 ]]
  then
  #Xvfb :80.0 -screen 0 1280x1024x24 > /dev/null 2>&1 &
  echo "[Unit]" > /etc/systemd/system/xvfb.service
  echo "Description=Virtual Frame Buffer X Server" >> /etc/systemd/system/xvfb.service
  echo "After=network.target" >> /etc/systemd/system/xvfb.service
  echo "" >> /etc/systemd/system/xvfb.service
  echo "[Service]" >> /etc/systemd/system/xvfb.service
  echo "ExecStart=/usr/bin/Xvfb :80 -screen 0 1280x1024x24 -ac +extension GLX +render -noreset" >> /etc/systemd/system/xvfb.service
  echo "" >> /etc/systemd/system/xvfb.service
  echo "[Install]" >> /etc/systemd/system/xvfb.service
  echo "WantedBy=multi-user.target" >> /etc/systemd/system/xvfb.service
  chmod +x /etc/systemd/system/xvfb.service
  systemctl daemon-reload
  systemctl enable xvfb.service
  systemctl start xvfb.service
  systemctl status xvfb.service
fi
