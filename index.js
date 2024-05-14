require('dotenv').config();
const express = require('express');
const puppeteer = require("puppeteer");
const https = require("https");

const passwordEvaluar = process.env.PASSWORD_EVALUAR
const emailEvaluar = process.env.EMAIL_EVALUAR

const app = express();
const PORT = 3000;

function sendPostRequest(email) {

    const postData = JSON.stringify({
      email: email
    });
  
    const options = {
      hostname: 'prod-183.westeurope.logic.azure.com',
      port: 443,
      path: '/workflows/c8c32e3d0cf74b1488ddbc52f8c7702f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Pcz1kmiFItoqZnshlOUZGzeTGkwfHqJhJDVpMFphvWU',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
  
    const req = https.request(options, res => {
      console.log(`Estado de la respuesta: ${res.statusCode}`);

      res.on('data', data => {
        console.log('Datos de la respuesta:', data.toString());
      });
    });
  
    req.on('error', error => {
      console.error('Error al hacer la solicitud:', error);
    });
  
    req.write(postData);
    req.end();
  }

  app.get('/evaluar', async (req, res) => {
    try {
        let data = {};

        const endpointUrl = 'https://prod-247.westeurope.logic.azure.com:443/workflows/43548647236a48e39155359b061fa101/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2N9kY6PqW28yohqzDJklhA1LsWIcoEY_3aTt6hR7Kw0';

        https.get(endpointUrl, (res) => {
            let tempData = '';
            res.on('data', (chunk) => {
                tempData += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(tempData);
                    data = jsonData;
                } catch (error) {
                    console.error('Los datos no son JSON válidos:', error);
                }
            });
        }).on('error', (error) => {
            console.error(`Error al realizar la solicitud: ${error.message}`);
        });

        const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        await page.goto('https://auth.evaluar.com/auth/realms/evcore/protocol/openid-connect/auth?client_id=evcap&redirect_uri=https%3A%2F%2Fapp.evaluar.com%2Fauth%2Flogin&state=4b0daa7a-a789-4a53-b9ec-1daf16c5d5ec&response_mode=fragment&response_type=code&scope=openid&nonce=93c94f83-036a-4be4-95ec-2d8995d5b12b');

        // Autentificacion

        const inputUsername = await page.$('#username');
        await inputUsername.type(emailEvaluar);

        const inputPassword = await page.$('#password');
        await inputPassword.type(passwordEvaluar);

        const buttomSubmit = await page.$('#kc-login');
        await buttomSubmit.click();
        //await buttomSubmit.evaluate( buttom => buttom.click())

        await page.waitForXPath('/html/body/div[2]/div/div/div[3]/div/div[2]/section/div[3]/div[1]/div/div[1]/div[1]/div/div');

        const [inputSearch] = await page.$x('/html/body/div[2]/div/div/div[3]/div/div[2]/section/div[3]/div[1]/div/div[1]/div[1]/div/div/div[4]/input');
        await inputSearch.type('ntt data ecuador');

        await page.evaluate(() => {
            return new Promise(resolve => {
                setTimeout(resolve, 5000);
            });
        });

        const firstResultTable = await page.$('.v-data-table__tbody tr:first-child');
        await firstResultTable.click();

        for (const staff of data.selected_staff) {
            await page.evaluate(() => {
                return new Promise(resolve => {
                    setTimeout(resolve, 5000);
                });
            });

            // Agregar candidato
            await page.waitForXPath('/html/body/div[2]/div/div/main/div[3]/div[1]/div[1]/div[2]/div/div[1]/button');
            const [addCandidateButton] = await page.$x('/html/body/div[2]/div/div/main/div[3]/div[1]/div[1]/div[2]/div/div[1]/button');
            await addCandidateButton.scrollIntoView();
            await addCandidateButton.hover();
            await addCandidateButton.click();

            await page.evaluate(() => {
                return new Promise(resolve => {
                    setTimeout(resolve, 5000);
                });
            });

            await page.keyboard.type(staff.email);

            await page.evaluate(() => {
                return new Promise(resolve => {
                    setTimeout(resolve, 1000);
                });
            });

            await page.keyboard.press('Tab');
            await page.keyboard.type('Otro');

            await page.evaluate(() => {
                return new Promise(resolve => {
                    setTimeout(resolve, 1000);
                });
            });

            await page.keyboard.press('Tab');
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(staff.name);

            await page.evaluate(() => {
                return new Promise(resolve => {
                    setTimeout(resolve, 1000);
                });
            });

            await page.keyboard.press('Tab');
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(staff.lastname);

            await page.evaluate(() => {
                return new Promise(resolve => {
                    setTimeout(resolve, 1000);
                });
            });

            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.keyboard.press('Enter');

            sendPostRequest(staff.email);

            await page.evaluate(() => {
                return new Promise(resolve => {
                    setTimeout(resolve, 7000);
                });
            });
        }

        await browser.close();
        res.status(200).send("Postulantes agregados correctamente");
    } catch (error) {
        console.error("Error en la solicitud:", error);
        res.status(500).send("Se produjo un error en el servidor.");
    }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});