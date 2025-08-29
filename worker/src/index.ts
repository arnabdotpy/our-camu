import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { cors } from "hono/cors";
const app = new Hono();
app.use("*", cors());
const stu_profiles = [
    {
        "username": "E23CSEU0705@bennett.edu.in",
        "password": "Reo@#2004",
        "name": "Arnab Roy",
        "category": ["G6", "AI"]
    },
    {
        "username": "e23cseu0698@bennett.edu.in",
        "password": "8UzUwsg4",
        "name": "Aditya Shanker",
        "category": ["G6", "DataScience"]
    },
    {
        "username": "e23cseu0688@bennett.edu.in",
        "password": "Arka@671",
        "name": "Arkadip Das",
        "category": ["G6", "AI"]
    },
    {
        "username": "e23cseu0638@bennett.edu.in",
        "password": "Wlb9fQ0v",
        "name": "Shikhar Kar",
        "category": ["G6", "DataScience"]
    },
    {
        "username": "E23CSEU0712@bennett.edu.in",
        "password": "6uyJtDPm",
        "name": "Karan Tyagi",
        "category": ["G6", "AI"]
    },
    {
        "username": "E23CSEU0679@bennett.edu.in",
        "password": "U0b6K0ED",
        "name": "Abhishek Sharma",
        "category": ["G6", "AI"]
    },
    {
        "username": "e23cseu0672@bennett.edu.in",
        "password": "10-11-2005",
        "name": "Piyush Pagare",
        "category": ["G6", "DataScience"]
    },
    {
        "username": "e23cseu0692@bennett.edu.in",
        "password": "QmlInnsb",
        "name": "Urvashi Agarwal",
        "category": ["G6", "AI"]
    },
    {
        "username": "e23Cseu0500@bennett.edu.in",
        "password": "AQDKa1wC",
        "name": "Ayush",
        "category": ["G6"]
    },
    {
        "username": "E23CSEU0121@bennett.edu.in",
        "password": "Hardy@2004",
        "name": "Hardik",
        "category": ["Batch5"]
    },
    {
        "username": "E23CSEU0127@bennett.edu.in",
        "password": "Vansh@2005",
        "name": "Vansh",
        "category": ["Batch5"]
    },
    {
        "username": "E23CSEU0137@bennett.edu.in",
        "password": "Silky@2004",
        "name": "Silky",
        "category": ["Batch5"]
    },
    
]

async function get_cookies(username: string, password: string) {
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-GB,en;q=0.8',
        'clienttzofst': '330',
        'content-type': 'application/json',
        'origin': 'https://student.bennetterp.camu.in',
        'priority': 'u=1, i',
        'referer': 'https://student.bennetterp.camu.in/v2/?id=663474b11dd0e9412a1f793f',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
    };

    const json_data = {
        'dtype': 'M',
        'Email': username,
        'pwd': password,
    };

    const response = await fetch('https://student.bennetterp.camu.in/login/validate', {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(json_data),
	});

	const response_json = await response.json() as { output: { data: { logindetails: { Student: { StuID: string }[] } } } };
	   const stu_id = response_json.output.data.logindetails.Student[0].StuID;
	   const cookieHeader = response.headers.get("Set-Cookie");
	   if (!cookieHeader) {
	       throw new Error("No Set-Cookie header found");
	   }
	   const cookie = cookieHeader.split(";")[0].split("=")[1];
    return { cookie, stu_id };
}

async function mark_attendance(stu_id: string, cookie: string, qr_code: string) {
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-GB,en;q=0.8',
        'clienttzofst': '330',
        'content-type': 'application/json',
        'origin': 'https://student.bennetterp.camu.in',
        'priority': 'u=1, i',
        'referer': 'https://student.bennetterp.camu.in/v2/timetable',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
		'Cookie': `connect.sid=${cookie}`
    };

    const json_data = {
        'attendanceId': qr_code,
        'StuID': stu_id,
        'offQrCdEnbld': true,
    };

    const response = await fetch('https://student.bennetterp.camu.in/api/Attendance/record-online-attendance', {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(json_data)
	});
	
	const response_json = await response.json() as { output: { data: { code: string } } };
    return response_json.output.data.code;
}

async function process_student(student: { username: string; password: string; name: string; category: string[] }, qr_code: string) {
    try {
        const { cookie, stu_id } = await get_cookies(student.username, student.password);
        const response = await mark_attendance(stu_id, cookie, qr_code);
        return `${student.name}: ${response}\n`;
    } catch (e) {
        return `${student.name}: Error - ${(e as Error).message}\n`;
    }
}


app.get('/', (c) => {
	return c.text('Worker is running!');
});

app.post('/mark_attendance', async (c) => {
	const { category, qr_code } = await c.req.json();
	
	return stream(c, async (stream) => {
		const students_to_process = stu_profiles.filter(p => p.category.includes(category));
		
		// This is a reimplementation of Python's `concurrent.futures.ThreadPoolExecutor`
		// and `as_completed` to give you the exact same behavior as the Flask app.
		const promises: Promise<void>[] = [];
		for(const student of students_to_process) {
			const promise = process_student(student, qr_code).then(async (result) => {
				await stream.write(result);
			});
			promises.push(promise);
		}

		await Promise.all(promises);
	});
});


export default app;
