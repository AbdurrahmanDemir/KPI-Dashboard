const express = require('express');

const {
    listSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    sendTestReport,
} = require('../controllers/reportSchedule.controller');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ReportSchedules
 *   description: Otomatik e-posta rapor planlari
 */

router.use(authenticate, requireRoles('admin', 'marketing_manager'));

/**
 * @swagger
 * /report-schedules:
 *   get:
 *     summary: Kayitli rapor planlarini listeler
 *     tags: [ReportSchedules]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Rapor planlari listesi
 *   post:
 *     summary: Yeni rapor plani olusturur
 *     tags: [ReportSchedules]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Olusturulan rapor plani
 */
router.get('/', listSchedules);
router.post('/', createSchedule);

/**
 * @swagger
 * /report-schedules/{id}:
 *   put:
 *     summary: Rapor planini gunceller
 *     tags: [ReportSchedules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Guncellenmis rapor plani
 *   delete:
 *     summary: Rapor planini siler
 *     tags: [ReportSchedules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Silme sonucu
 */
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

/**
 * @swagger
 * /report-schedules/{id}/test:
 *   post:
 *     summary: Mock test e-postasi gonderir
 *     tags: [ReportSchedules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Test gonderim sonucu
 */
router.post('/:id/test', sendTestReport);

module.exports = router;
