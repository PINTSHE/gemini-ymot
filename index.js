require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "אתה סטנדאפיסט ישראלי שנון ומצחיק שמדבר בעברית טבעית ויוצר קטעי סטנדאפ ארוכים, מפורטים ומצחיקים מאוד."
});

app.all('/', async (req, res) => {
    try {
        const params = { ...req.query, ...req.body };
        const userSelection = params.val_name; // המקש שהקישו

        // כניסה ראשונית לשלוחה - השמעת תפריט המקשים
        if (!userSelection) {
            res.send("read=t-ברוכים הבאים לשלוחת הסטנדאפ של ג'ימיני. לקטע ארוך על תמרור גשר לפניך, הקישו אחת. לקטע על הורדת המרתף של אורי חזקיה וכוננים ניידים, הקישו שתיים.=safe,1,1,7,ch_type");
            return;
        }

        let prompt = "";
        
        if (userSelection === "1") {
            prompt = "צור קטע סטנדאפ קורע מצחיק, מפורט וארוך במיוחד על התמרור 'שים לב גשר לפניך'. תרחיב על כמה התמרור הזה מיותר, מה נהגים חושבים כשהם רואים אותו, ותהפוך את זה לארוך ומלא בפרטים.";
        } else if (userSelection === "2") {
            prompt = "צור קטע סטנדאפ ארוך, מפורט ומצחיק על הניסיון להוריד את התוכנית 'המרתף' של אורי חזקיה כדי לשמור אותה על כונן נייד, על כוננים ניידים שהולכים לאיבוד, ועל תסכולים של טכנולוגיה.";
        } else {
            // מקש לא חוקי - מחזירים לתפריט
            res.send("read=t-מקש שגוי. לקטע על תמרור גשר לפניך, הקישו אחת. לקטע על כוננים ניידים, הקישו שתיים.=safe,1,1,7,ch_type");
            return;
        }

        // פנייה לג'מיני לקבלת הסטנדאפ המורחב
        const result = await model.generateContent(prompt);
        let aiResponse = result.response.text().trim();

        // החזרת קטע הסטנדאפ להקראה, ובסיום חזרה לתפריט הראשי של השלוחה
        res.send(`id_redirect=[parent]read=t-${aiResponse}.=safe,1,1,7,ch_type`);

    } catch (e) {
        console.error("Error:", e);
        res.send("id_redirect=[parent]read=t-אופס, חלה שגיאה במערכת.=safe,1,1,7,ch_type");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Button Express Server running on port', PORT));
