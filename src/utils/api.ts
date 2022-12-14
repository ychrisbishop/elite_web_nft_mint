import axios from 'axios'
import * as dotenv from 'dotenv'
import env from '../config'

dotenv.config()

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || env.API,
  headers: {
    'x-auth-token':'token1234567890'
    // common: {
    //   'x-auth-token':'token1234567890'
    // }
  }
})
