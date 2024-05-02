### run with the gee anaconda env
import requests, sys, os, time
import psycopg2
from PIL import Image 

RESOLUTIONS = ['medium', 'thumb']

dsn = "host=localhost port=5432 dbname='inaturalist' user='postgres' password='admin'"
SQL = "SELECT user_id FROM observations GROUP BY user_id ORDER BY user_id DESC"

flog = open("log.txt", "a")

try:
    con = psycopg2.connect(dsn)
    cur = con.cursor()

    cur.execute(SQL)

    N = cur.rowcount
    N_CHUNK = 500
    res = cur.fetchmany(N_CHUNK)
    N_ACC = 0
    i = 0
    t00 = time.time()
    while len(res) > 0:
        string = '***chunk %d/%d' % (i+1, int(N/N_CHUNK+0.5))
        print(string)
        flog.write(string + '\n')
        for row in res:
            uid = row[0]
            name = str(uid) + '.jpg' 
            #print(uid)
            FLAG = True
            for RES in RESOLUTIONS[0:1]:

                if os.path.isfile(RES + os.sep + name):
                    string = '\t...image %s already exists - skipped' % str(RES + os.sep + name)
                    print(string)
                    flog.write(string + '\n')
                    FLAG = False
                    continue
                
                #url_default = 'https://www.inaturalist.org/attachment_defaults/users/icons/defaults/%s.png' % RES 

                url = 'https://static.inaturalist.org/attachments/users/icons/%d/%s.jpg' % (uid, RES)
               
                # This statement requests the resource at 
                # the given link, extracts its contents 
                # and saves it in a variable 
                img = requests.get(url)
                if not img.ok:
                    url = url.replace('.jpg', '.jpeg')        
                    img = requests.get(url)
                    if not img.ok:
                        string = '\t---use default for uid %d' % (uid)
                        print(string)
                        flog.write(string + '\n')
                        FLAG = False
                        break
                # Opening a new file named img with extension .jpg 
                # This file would store the data of the image file 
                
                f = open(RES + os.sep + name,'wb') 
              
                # Storing the image data inside the data variable to the file 
                f.write(img.content) 
                f.close()
                
            if N_ACC % 10 == 0 and FLAG:
                t11 = time.time()
                t = t11 - t00
                string = '\t...%d/%d - userid %d downloaded - average speed %.3f sec per user - %.3f hours remaining' % (N_ACC+1, N, uid, t/(N_ACC+1), (N*(t/(N_ACC+1))-t)/3600)
                print(string)
                flog.close()
                flog = open("log.txt", "a")
                flog.write(string + '\n')
            N_ACC += 1
        
        i += 1
        res = cur.fetchmany(N_CHUNK)

    print('N_ACC: %d' % N_ACC)
    cur.close()
    con.close()
    flog.close()
except psycopg2.Error as e:
    print("PostgreSQL error occurred 1 ...")
    print(e)
    raise e
    flog.close()

except Exception as e:
    #print(e)
    raise e
    flog.close()
