> [!IMPORTANT]
> Bienvenido al repositorio oficial de Kirito-Bot MD — un bot multifuncional para WhatsApp impulsado por la librería Baileys.
Este proyecto se encuentra en desarrollo activo y puede presentar fallos ocasionales durante su funcionamiento.
Mantente actualizado a través de nuestro canal oficial:
[Kirito channel](https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29)

---

<p align="center">
    <img src="https://cdn.dix.lat/me/xczawu-c91x-ppumit-d47b22.svg" alt="SQL" />
  </a>
</p>

<h1 align="center">
  <strong>⧫ ᴋɪʀɪᴛᴏ - ᴋᴀᴢᴜᴛᴏ ᴋɪʀɪɢᴀʏ ♛</strong>
</h1>

<p align="center">
  <a href="https://github.com/eliac-d/kirito-Bot-MD">
    <img src="https://kirito.dix.lat/api/stats?user=Eliac-d%20&repo=kirito-Bot-MD-v3&style=hologram&theme=monochrome&width=450&align=left&animate=false&show_owner=false&hide_border=false&bg=000000&border=333333&title=ffffff&text=ffffff&accent=ffffff&sub=666666" width="100%" max-width="450" />
  </a>
</p>

> [!IMPORTANT]
> **Requisito Obligatorio — Credenciales de API:**
> Este sistema requiere obligatoriamente una clave de acceso única para consumir los servicios del ecosistema. Cada usuario debe configurar su propio entorno para desplegar el bot:
> 1. Regístrate en el panel oficial de control: **[panel.apinexus.fun](https://panel.apinexus.fun)**
> 2. Obtén tu Token/API Key personal dentro de tu perfil.
> 3. Abre tu archivo `.env` en la raíz del proyecto y asígnala directamente en la variable correspondiente (`API_KEY`). Si ejecutas el bot sin esta configuración, el sistema fallará por falta de autorización.

> [!TIP]
> **Persistencia Híbrida Inteligente (MongoDB es OPCIONAL):**
> El bot está diseñado para ser completamente **Plug & Play**. No necesitas configurar bases de datos externas en la nube obligatoriamente para usarlo. 
> * **Sin configuración adicional:** Si no agregas ninguna URL de MongoDB, el núcleo activará automáticamente un sistema de almacenamiento **SQL Local**, estructurando y guardando todos los datos directamente en el almacenamiento interno del servidor de manera transparente y optimizada.

> [!WARNING]
> **¿Cuándo usar MongoDB Atlas? (Recomendaciones de Carga):**
> Si planeas desplegar el bot en **servidores pequeños o limitados** (con poco espacio en disco o recursos de hardware reducidos) y estimas que el bot estará bajo **alta demanda o ráfagas masivas de carga**, es altamente recomendable configurar una URL de MongoDB. Al detectar la URL, el bot migrará el almacenamiento a la nube de manera automática, reduciendo el consumo de I/O local y protegiendo el rendimiento del host ante cuellos de botella.

---

<h2 align="center">🛠️ Stack Tecnológico & Arquitectura</h2>

<p align="center">
  El núcleo de <strong>kirito-Bot MD✰</strong> implementa una capa de abstracción que separa la lógica de negocio de la persistencia de datos, permitiendo una escalabilidad horizontal eficiente y una latencia de respuesta ultra-baja.
</p>

<table align="center">
  <tr>
    <th>Componente</th>
    <th>Tecnología</th>
    <th>Propósito Operativo</th>
  </tr>
  <tr>
    <td><b>Runtime</b></td>
    <td><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /></td>
    <td>Entorno de ejecución v20+ (LTS) de alto rendimiento.</td>
  </tr>
  <tr>
    <td><b>Protocolo</b></td>
    <td><img src="https://img.shields.io/badge/Baileys-FF4B4B?style=for-the-badge&logo=whatsapp&logoColor=white" /></td>
    <td>Multi-Device Socket Connection (v6.x.x).</td>
  </tr>
  <tr>
    <td><b>Core Gateway</b></td>
    <td><img src="https://img.shields.io/badge/ApiNexus-0052CC?style=for-the-badge&logo=unshrtn&logoColor=white" /></td>
    <td>Autenticación de microservicios externos mediante clave de desarrollo personal.</td>
  </tr>
  <tr>
    <td><b>Database (Hybrid)</b></td>
    <td>
      <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
      <img src="https://img.shields.io/badge/SQL_Local-555555?style=for-the-badge&logo=sqlite&logoColor=white" />
    </td>
    <td>Mapeo automatizado: Enruta a la nube si detecta string de conexión Mongoose, u optimiza almacenamiento relacional estructurado de forma local.</td>
  </tr>
  <tr>
    <td><b>Estructura</b></td>
    <td><img src="https://img.shields.io/badge/ES_Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" /></td>
    <td>Arquitectura asíncrona modular de baja latencia.</td>
  </tr>
  <tr>
    <td><b>Media CDN</b></td>
    <td><img src="https://img.shields.io/badge/Dix.lat-000000?style=for-the-badge&logo=fastapi&logoColor=white" /></td>
    <td>Optimización de activos y ruteo de enlaces.</td>
  </tr>
</table>

---

<h2 align="center">🚀 Despliegue Estratégico</h2>

<p align="center">
  Infraestructura optimizada para entornos <b>Headless</b>. Compatible con arquitecturas x64 y ARMv8 (Android/VPS).
</p>

### 📱 Terminal Emulation (Termux)
Para un despliegue ágil en dispositivos móviles, se recomienda el uso del binario oficial para evitar conflictos en la compilación de librerías nativas de cifrado.

<p align="left">
  <a href="https://github.com/termux/termux-app/releases/latest/download/termux-app_universal.apk">
    <img src="https://img.shields.io/badge/ADQUIRIR_TERMUX_APK-222222?style=for-the-badge&logo=android&logoColor=white&border=true" />
  </a>
</p>

#### ⚡ Setup de Inicialización Automática
Haz clic en el desplegable para visualizar los comandos de configuración del entorno:

<details>
<summary><b>📂 CLICK PARA EXPANDIR COMANDOS DE INSTALACIÓN (TERMUX/VPS)</b></summary>
<br>

> [!TIP]
> **1. Sincronización de dependencias globales**
> ```bash
> pkg update && pkg upgrade -y && \
> pkg install git nodejs-lts ffmpeg imagemagick -y
> ```
> 
> **2. Clonación y despliegue del núcleo**
> ```bash
> git clone [https://github.com/eliac-d/kirito-Bot-MD](https://github.com/eliac-d/kirito-Bot-MD)
> cd kirito-Bot-MD
> ```
> 
> **3. Inyección de módulos y arranque**
> ```bash
> npm install && npm start
> ```

</details>

---

> [!NOTE]
> Gestión de Procesos: En entornos de producción (VPS), es mandatorio el uso de PM2 para el monitoreo del ciclo de vida del bot, asegurando la resiliencia ante excepciones críticas y reinicios automáticos.

<div align="center">
  <hr style="border: 1px solid #333;">
  <br>
  <img src="https://img.shields.io/badge/SPONSORSHIP_PROGRAM-PLATINUM_LEVEL-FFD700?style=for-the-badge&logo=github-sponsors&logoColor=black&labelColor=171717" height="35" />
  <br><br>
  <h3>💎 Impulsa el Ecosistema de Kazuto Kirigay</h3>
  <p style="width: 80%; text-align: center; color: #888;">
    Si este sistema de automatización te ha aportado valor, considera realizar una contribución estratégica. Tu apoyo directo financia el mantenimiento de nuestros clústeres de <b>MongoDB™ Atlas</b>, servidores de media en <b>dix.lat</b> y el desarrollo de nuevas funciones de IA de baja latencia.
  </p>
  <br>
  <a href="https://www.paypal.me/DeylinB">
    <img src="https://img.shields.io/badge/CONTRIBUTE_VIA-PAYPAL-00457C?style=for-the-badge&logo=paypal&logoColor=white&labelColor=000000" height="45" />
  </a>
  <br><br>
  <p style="font-size: 0.9em; color: #555;"><i>"Mantenemos la red en línea gracias a contribuidores como tú."</i></p>
  <br>
  <hr style="border: 1px solid #333;">
</div>

<h2 align="center">🤝 Programa de Colaboración Estratégica</h2>

<p align="center">
  Buscamos ingenieros de software y entusiastas de la automatización que deseen contribuir al desarrollo del ecosistema <strong>kirito-Bot MD</strong>. No buscamos "ayudantes", buscamos <b>colaboradores técnicos</b> con visión de escalabilidad.
</p>

<table align="center">
  <tr>
    <th>Rol</th>
    <th>Stack Requerido</th>
    <th>Objetivo</th>
  </tr>
  <tr>
    <td><b>Core Developer</b></td>
    <td>Node.js / Baileys / ESM</td>
    <td>Optimización del kernel y gestión de WebSockets.</td>
  </tr>
  <tr>
    <td><b>Data Engineer</b></td>
    <td>MongoDB / Supabase</td>
    <td>Arquitectura de esquemas y eficiencia en persistencia.</td>
  </tr>
  <tr>
    <td><b>Cloud Architect</b></td>
    <td>Docker / VPS / PM2</td>
    <td>Despliegue distribuido y monitoreo de procesos.</td>
  </tr>
</table>

<br>

<div align="center">
  <p><b>¿Cómo formar parte del equipo?</b></p>
  <p style="color: #888;">Si tienes experiencia en el stack mencionado y quieres dejar tu huella en un sistema con tráfico real:</p>
  
  <a href="https://github.com/eliac-d/kirito-Bot-MD/issues">
    <img src="https://img.shields.io/badge/ABRIR_CONTRIBUTION_ISSUE-222222?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  
  <a href="https://wa.me/50432955554">
    <img src="https://img.shields.io/badge/CONTACTAR_VÍA_WHATSAPP-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
  </a>
</div>

<br>

> [!TIP]
> **Open Source Mindset:** Todas las contribuciones aceptadas serán debidamente acreditadas en la sección de `Contributors`. Valoramos el código limpio, sin comentarios innecesarios y estructurado bajo los estándares de **ES Modules**.

<br>
<hr style="border: 1px solid #333;">
<p align="center">
  <sub>Propiedad intelectual de <b>Deylin Eliac</b> © 2026</sub>
</p>

<br>
<p align="center">
 <a href="https://api.Dix.lat">
  <img src="https://img.shields.io/badge/API_API_DIX_LAT-000000?style=flat-square&logo=visualstudiocode&logoColor=white" />
</a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://dix.lat/channel">
    <img src="https://img.shields.io/badge/Official_Channel-25D366?style=flat-square&logo=whatsapp&logoColor=white" />
  </a>
</p>
<br>

[![GitHub Streak](https://streak-stats.demolab.com?user=eliac-d%20&theme=merko&hide_border=&locale=es&short_numbers=&date_format=j%2Fn%5B%2FY%5D&mode=weekly)](https://git.io/streak-stats)
