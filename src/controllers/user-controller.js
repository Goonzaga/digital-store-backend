const service = require('../services/user-service');

exports.get = async (req, res) => res.status(200).json(await service.getById(req.params.id));
exports.create = async (req, res) => res.status(201).json(await service.create(req.body));
exports.update = async (req, res) => { await service.update(req.params.id, req.body); res.status(204).end(); };
exports.remove = async (req, res) => { await service.remove(req.params.id); res.status(204).end(); };
exports.token = async (req, res) => res.status(200).json({ token: await service.token(req.body.email, req.body.password) });
