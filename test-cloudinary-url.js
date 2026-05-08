import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

cloudinary.config({
  cloud_name: 'dqwirgfzg',
  api_key: '175189525432537',
  api_secret: 'qFcIWdBtOl82473EMMM4I1TMn6U'
});

console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL);

const publicId = 'pau-lms/1715183424000-some-file.pdf'; // mock public id

// Try different URL generations
const url1 = cloudinary.utils.private_download_url(publicId, '', { resource_type: 'raw' });
const url2 = cloudinary.utils.private_download_url(publicId, 'pdf', { resource_type: 'raw' });
const url3 = cloudinary.url(publicId, { sign_url: true, resource_type: 'raw', type: 'upload' });
const url4 = cloudinary.url(publicId, { sign_url: true, resource_type: 'raw', type: 'authenticated' });

console.log('1 (private_download_url, no format):', url1);
console.log('2 (private_download_url, with format):', url2);
console.log('3 (signed delivery, upload):', url3);
console.log('4 (signed delivery, authenticated):', url4);
